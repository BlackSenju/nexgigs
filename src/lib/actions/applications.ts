"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { sendNotification } from "@/lib/actions/notifications";
import { sendEmail, hiredEmail } from "@/lib/email";

/**
 * Get all applications for a specific job (poster only).
 */
export async function getJobApplications(jobId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { applications: [], error: "Not authenticated" };

  // Verify user is the poster
  const { data: job } = await supabase
    .from("nexgigs_jobs")
    .select("poster_id, title")
    .eq("id", jobId)
    .single();

  if (!job || job.poster_id !== user.id) {
    return { applications: [], error: "Not authorized" };
  }

  const { data: applications } = await supabase
    .from("nexgigs_applications")
    .select(`
      *,
      gigger:nexgigs_profiles!gigger_id(
        id, first_name, last_initial, city, state, neighborhood,
        avatar_url, identity_verified, background_checked, verification_tier
      )
    `)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  // Get ratings and XP for each applicant
  const enriched = await Promise.all(
    (applications ?? []).map(async (app) => {
      const giggerId = app.gigger_id;
      const [ratingRes, xpRes, skillsRes] = await Promise.all([
        supabase.from("nexgigs_user_ratings").select("average_rating, total_ratings").eq("user_id", giggerId).single(),
        supabase.from("nexgigs_user_xp").select("current_level, level_title, gigs_completed").eq("user_id", giggerId).single(),
        supabase.from("nexgigs_skills").select("skill_name").eq("user_id", giggerId).limit(5),
      ]);
      return {
        ...app,
        gigger_rating: ratingRes.data,
        gigger_xp: xpRes.data,
        gigger_skills: skillsRes.data ?? [],
      };
    })
  );

  return { applications: enriched, jobTitle: job.title };
}

/**
 * Accept an application — poster hires the gigger.
 */
export async function acceptApplication(applicationId: string, jobId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // SECURITY: Verify user is the poster of this job
  const { data: jobCheck } = await supabase
    .from("nexgigs_jobs")
    .select("poster_id")
    .eq("id", jobId)
    .single();
  if (!jobCheck || jobCheck.poster_id !== user.id) {
    return { error: "Not authorized" };
  }

  // Fetch application details for notification
  const { data: application } = await supabase
    .from("nexgigs_applications")
    .select("gigger_id, job_id")
    .eq("id", applicationId)
    .single();

  // SECURITY: Verify the application belongs to this job
  if (!application || application.job_id !== jobId) {
    return { error: "Invalid application" };
  }

  // Update application status
  const { error } = await supabase
    .from("nexgigs_applications")
    .update({ status: "accepted" })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  // Reject other pending applications
  await supabase
    .from("nexgigs_applications")
    .update({ status: "rejected" })
    .eq("job_id", jobId)
    .neq("id", applicationId)
    .eq("status", "pending");

  // Update job status
  await supabase
    .from("nexgigs_jobs")
    .update({ status: "hired" })
    .eq("id", jobId);

  await logAuditEvent(user.id, "job.hired", "application", applicationId, { jobId });

  // Notify the hired gigger (in-app + email)
  if (application?.gigger_id) {
    const { data: job } = await supabase
      .from("nexgigs_jobs")
      .select("title, price")
      .eq("id", jobId)
      .single();

    await Promise.all([
      sendNotification({
        userId: application.gigger_id,
        type: "hired",
        title: "You've been hired!",
        body: `You've been hired for "${job?.title ?? "a gig"}"`,
        link: "/gigs",
      }).catch((err) => console.error("[acceptApplication] Notification failed:", err)),

      // Hired confirmation email
      (async () => {
        try {
          const admin = createAdminClient();

          const [giggerAuth, giggerProfile, posterProfile] = await Promise.all([
            admin.auth.admin.getUserById(application.gigger_id),
            admin
              .from("nexgigs_profiles")
              .select("first_name")
              .eq("id", application.gigger_id)
              .maybeSingle(),
            admin
              .from("nexgigs_profiles")
              .select("first_name")
              .eq("id", user.id)
              .maybeSingle(),
          ]);

          const giggerEmail = giggerAuth?.data?.user?.email;
          if (!giggerEmail) return;

          const email = hiredEmail({
            giggerFirstName: giggerProfile.data?.first_name ?? "there",
            jobTitle: job?.title ?? "the job",
            jobId,
            posterFirstName: posterProfile.data?.first_name ?? "the poster",
            agreedPrice: job?.price ?? null,
          });

          await sendEmail(giggerEmail, email.subject, email.html);
        } catch (err) {
          console.error("[acceptApplication] Hired email failed:", err);
        }
      })(),
    ]);
  }

  return { success: true };
}

/**
 * Reject a single application.
 */
export async function rejectApplication(applicationId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // SECURITY: Verify user is the poster of the job this application is for
  const { data: app } = await supabase
    .from("nexgigs_applications")
    .select("job_id, job:nexgigs_jobs!job_id(poster_id)")
    .eq("id", applicationId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app?.job as any;
  if (!job || job.poster_id !== user.id) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("nexgigs_applications")
    .update({ status: "rejected" })
    .eq("id", applicationId);

  return error ? { error: error.message } : { success: true };
}
