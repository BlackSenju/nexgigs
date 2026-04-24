"use server";

import { createClient } from "@/lib/supabase/server";
import {
  authorizePayment,
  capturePayment,
  cancelPayment,
  createCustomer,
} from "@/lib/stripe";
import { calculateFees } from "@/lib/constants";
import { notifyDiscord } from "@/lib/discord";
import { logAuditEvent } from "@/lib/audit";
import { awardXP, checkMilestones } from "@/lib/actions/xp";

/**
 * Hire a gigger for a job — creates hired_job record and authorizes payment.
 */
export async function hireGigger(input: {
  jobId: string;
  giggerId: string;
  agreedPrice: number;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Validate caller-supplied agreedPrice. Without bounds a malicious client
  // can submit absurd values which flow through to Stripe authorization.
  // $0.50 floor matches Stripe's minimum charge; $50,000 ceiling is a sane
  // upper bound for a single gig and can be relaxed later if needed.
  if (
    !Number.isFinite(input.agreedPrice) ||
    input.agreedPrice < 0.5 ||
    input.agreedPrice > 50000
  ) {
    return { error: "Invalid price" };
  }

  // Verify the caller actually owns this job and that the job is still open
  // BEFORE we touch Stripe. Otherwise an authenticated user could authorize
  // a payment intent against another user's gigger by passing an arbitrary
  // jobId — Supabase RLS would catch the later insert, but Stripe's
  // authorize-then-cancel cycle would already have happened.
  const { data: job } = await supabase
    .from("nexgigs_jobs")
    .select("id, poster_id, status")
    .eq("id", input.jobId)
    .maybeSingle();

  if (!job) return { error: "Job not found" };
  if (job.poster_id !== user.id) return { error: "You can only hire on your own jobs" };
  if (job.status !== "open") return { error: "Job is not available to hire on" };

  // Get poster profile (for Stripe customer)
  const { data: poster } = await supabase
    .from("nexgigs_profiles")
    .select("first_name, last_initial, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!poster) return { error: "Profile not found" };

  // Get gigger profile (for Stripe Connect account)
  const { data: gigger } = await supabase
    .from("nexgigs_profiles")
    .select("first_name, last_initial, stripe_connect_account_id")
    .eq("id", input.giggerId)
    .single();

  if (!gigger) return { error: "Gigger not found" };

  if (!gigger.stripe_connect_account_id) {
    return { error: "This gigger hasn't set up payments yet. They need to connect their Stripe account first." };
  }

  // Ensure poster has a Stripe customer
  let customerI = poster.stripe_customer_id;
  if (!customerI) {
    try {
      customerI = await createCustomer(
        user.email!,
        user.id,
        `${poster.first_name} ${poster.last_initial}.`
      );
      await supabase
        .from("nexgigs_profiles")
        .update({ stripe_customer_id: customerI })
        .eq("id", user.id);
    } catch {
      return { error: "Failed to set up payment method" };
    }
  }

  // Calculate fees (default to free tier for now)
  const fees = calculateFees(input.agreedPrice, "free", "free");

  try {
    // Authorize payment (hold funds)
    const { paymentIntentId } = await authorizePayment({
      amount: fees.posterPays,
      posterCustomerId: customerI,
      giggerConnectAccountId: gigger.stripe_connect_account_id,
      applicationFee: fees.platformEarns,
      jobId: input.jobId,
      posterId: user.id,
      giggerId: input.giggerId,
    });

    // Create hired job record
    const { data: hiredJob, error: hireError } = await supabase
      .from("nexgigs_hired_jobs")
      .insert({
        job_id: input.jobId,
        poster_id: user.id,
        gigger_id: input.giggerId,
        agreed_price: input.agreedPrice,
        escrow_payment_intent_id: paymentIntentId,
        escrow_amount: fees.posterPays,
        status: "active",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (hireError) return { error: hireError.message };

    // Update job status
    await supabase
      .from("nexgigs_jobs")
      .update({ status: "hired" })
      .eq("id", input.jobId);

    // Update application status
    await supabase
      .from("nexgigs_applications")
      .update({ status: "accepted" })
      .eq("job_id", input.jobId)
      .eq("gigger_id", input.giggerId);

    // Reject other applications
    await supabase
      .from("nexgigs_applications")
      .update({ status: "rejected" })
      .eq("job_id", input.jobId)
      .neq("gigger_id", input.giggerId)
      .eq("status", "pending");

    // Get job title for notifications
    const { data: job } = await supabase
      .from("nexgigs_jobs")
      .select("title")
      .eq("id", input.jobId)
      .single();

    // Fire-and-forget notifications
    Promise.all([
      notifyDiscord("payment_received", {
        amount: fees.posterPays,
        jobTitle: job?.title ?? "Unknown",
        poster: `${poster.first_name} ${poster.last_initial}.`,
      }),
      logAuditEvent(user.id, "job.hired", "hired_job", hiredJob.id, {
        jobId: input.jobId,
        giggerId: input.giggerId,
        amount: input.agreedPrice,
      }),
    ]).catch(() => {});

    return { hiredJob };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed";
    return { error: message };
  }
}

/**
 * Complete a job — poster confirms and releases payment to gigger.
 */
export async function completeJob(hiredJobId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: hiredJob } = await supabase
    .from("nexgigs_hired_jobs")
    .select("*, job:nexgigs_jobs(title)")
    .eq("id", hiredJobId)
    .eq("poster_id", user.id)
    .single();

  if (!hiredJob) return { error: "Job not found or not authorized" };
  if (hiredJob.status !== "active") return { error: "Job is not active" };
  if (!hiredJob.escrow_payment_intent_id) return { error: "No payment to release" };

  try {
    // Capture the held payment (releases to gigger)
    await capturePayment(hiredJob.escrow_payment_intent_id);

    // Update hired job status
    await supabase
      .from("nexgigs_hired_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        payment_released_at: new Date().toISOString(),
      })
      .eq("id", hiredJobId);

    // Update job status
    await supabase
      .from("nexgigs_jobs")
      .update({ status: "completed" })
      .eq("id", hiredJob.job_id);

    const jobTitle = (hiredJob.job as Record<string, unknown>)?.title ?? "Unknown";

    // Award XP to gigger for completing the gig
    awardXP(hiredJob.gigger_id, "gig_complete", hiredJob.job_id).catch(() => {});
    checkMilestones(hiredJob.gigger_id).catch(() => {});

    // Update gigger earnings
    const { data: currentXp } = await supabase
      .from("nexgigs_user_xp")
      .select("total_earned")
      .eq("user_id", hiredJob.gigger_id)
      .single();

    await supabase
      .from("nexgigs_user_xp")
      .update({
        total_earned: (Number(currentXp?.total_earned) || 0) + Number(hiredJob.agreed_price),
      })
      .eq("user_id", hiredJob.gigger_id);

    Promise.all([
      notifyDiscord("job_completed", {
        jobTitle: String(jobTitle),
        gigger: hiredJob.gigger_id,
        amount: hiredJob.agreed_price,
      }),
      logAuditEvent(user.id, "job.completed", "hired_job", hiredJobId, {
        amount: hiredJob.agreed_price,
      }),
    ]).catch(() => {});

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to release payment";
    return { error: message };
  }
}

/**
 * Cancel a job — refund the held payment to poster.
 */
export async function cancelJob(hiredJobId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: hiredJob } = await supabase
    .from("nexgigs_hired_jobs")
    .select("*")
    .eq("id", hiredJobId)
    .or(`poster_id.eq.${user.id},gigger_id.eq.${user.id}`)
    .single();

  if (!hiredJob) return { error: "Job not found or not authorized" };
  if (hiredJob.status !== "active") return { error: "Job is not active" };

  try {
    if (hiredJob.escrow_payment_intent_id) {
      await cancelPayment(hiredJob.escrow_payment_intent_id);
    }

    await supabase
      .from("nexgigs_hired_jobs")
      .update({ status: "cancelled" })
      .eq("id", hiredJobId);

    await supabase
      .from("nexgigs_jobs")
      .update({ status: "open" })
      .eq("id", hiredJob.job_id);

    await logAuditEvent(user.id, "job.cancelled", "hired_job", hiredJobId);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel";
    return { error: message };
  }
}
