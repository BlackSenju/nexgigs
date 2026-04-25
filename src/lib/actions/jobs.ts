"use server";

import { createClient } from "@/lib/supabase/server";
import { moderateJobPosting } from "@/lib/moderation";
import { aiModerateContent } from "@/lib/ai";
import { notifyDiscord } from "@/lib/discord";
import { logAuditEvent } from "@/lib/audit";
import { geocodeAddress } from "@/lib/geocode";
import { sendNotification } from "@/lib/actions/notifications";
import { sendEmail, newApplicationEmail, jobPostedEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeOrSearch, sanitizeIlike, clampLimit } from "@/lib/postgrest";

export async function getJobs(filters?: {
  category?: string;
  city?: string;
  state?: string;
  search?: string;
  limit?: number;
}) {
  const supabase = createClient();
  let query = supabase
    .from("nexgigs_jobs")
    .select(`
      *,
      poster:nexgigs_profiles!poster_id(
        first_name,
        last_initial,
        city,
        neighborhood
      )
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (filters?.category && filters.category !== "All") {
    query = query.eq("category", filters.category);
  }
  if (filters?.city) {
    // Escape `%` and `_` wildcards so a caller cannot widen the match.
    const safeCity = sanitizeIlike(filters.city);
    if (safeCity.length > 0) query = query.ilike("city", `%${safeCity}%`);
  }
  if (filters?.state) {
    query = query.eq("state", filters.state.toUpperCase());
  }
  if (filters?.search) {
    const safe = sanitizeOrSearch(filters.search);
    if (safe.length > 0) {
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
    }
  }
  query = query.limit(clampLimit(filters?.limit));

  const { data, error } = await query;
  if (error) return { jobs: [], error: error.message };
  return { jobs: data ?? [] };
}

export async function getJobById(jobId: string) {
  const supabase = createClient();

  const { data: job, error } = await supabase
    .from("nexgigs_jobs")
    .select(`
      *,
      poster:nexgigs_profiles!poster_id(
        id,
        first_name,
        last_initial,
        city,
        state,
        neighborhood,
        verification_tier,
        identity_verified,
        created_at
      ),
      milestones:nexgigs_milestones(*)
    `)
    .eq("id", jobId)
    .single();

  if (error) return { job: null, error: error.message };

  // View tracking is now handled by trackJobView() in analytics.ts
  // Called from the client-side job detail page component

  // Get poster rating
  const { data: posterRating } = await supabase
    .from("nexgigs_user_ratings")
    .select("average_rating, total_ratings")
    .eq("user_id", job.poster_id)
    .single();

  // Get poster XP
  const { data: posterXp } = await supabase
    .from("nexgigs_user_xp")
    .select("current_level, level_title, gigs_completed, jobs_posted")
    .eq("user_id", job.poster_id)
    .single();

  return {
    job: {
      ...job,
      poster_rating: posterRating,
      poster_xp: posterXp,
    },
  };
}

export async function createJob(input: {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  jobType: string;
  durationType: string;
  pricingType: string;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  hourlyRate?: number;
  city: string;
  state: string;
  zipCode: string;
  neighborhood?: string;
  isRemote?: boolean;
  requiresLicense?: boolean;
  requiresBackgroundCheck?: boolean;
  isUrgent?: boolean;
  teamSizeNeeded?: number;
  startDate?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("first_name, last_initial")
    .eq("id", user.id)
    .single();

  // Content moderation — check for prohibited content
  const modResult = moderateJobPosting({
    title: input.title,
    description: input.description,
    price: input.price,
    category: input.category,
  });

  if (modResult.blocked) {
    return { error: modResult.blockReason ?? "This job posting contains prohibited content." };
  }

  // AI moderation in background (non-blocking, flags for review)
  aiModerateContent({
    content: `${input.title} ${input.description}`,
    contentType: "job",
  }).then((aiResult) => {
    if (!aiResult.safe) {
      notifyDiscord("security_alert", {
        message: `AI flagged job posting: ${input.title} — Issues: ${aiResult.issues.join(", ")}`,
        user: user.id,
      });
    }
  }).catch(() => {});

  // Geocode the location to get lat/lng
  const geoQuery = `${input.zipCode} ${input.city} ${input.state}`;
  const geo = await geocodeAddress(geoQuery);

  const { data: job, error } = await supabase
    .from("nexgigs_jobs")
    .insert({
      poster_id: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      subcategory: input.subcategory,
      job_type: input.jobType,
      duration_type: input.durationType,
      price: input.price,
      price_min: input.priceMin,
      price_max: input.priceMax,
      hourly_rate: input.hourlyRate,
      city: input.city,
      state: input.state.toUpperCase(),
      zip_code: input.zipCode,
      neighborhood: input.neighborhood || geo?.neighborhood,
      latitude: geo?.latitude,
      longitude: geo?.longitude,
      is_remote: input.isRemote ?? false,
      requires_license: input.requiresLicense ?? false,
      requires_background_check: input.requiresBackgroundCheck ?? false,
      is_urgent: input.isUrgent ?? false,
      team_size_needed: input.teamSizeNeeded ?? 1,
      is_team_job: (input.teamSizeNeeded ?? 1) > 1,
      start_date: input.startDate,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const displayPrice =
    input.price ?? input.priceMin ?? input.hourlyRate ?? "open";

  // AWAIT Discord + audit log + job posted confirmation email
  await Promise.all([
    notifyDiscord("job_posted", {
      title: input.title,
      category: input.category,
      price: displayPrice,
      city: input.city,
      state: input.state,
      poster: `${profile?.first_name ?? "Unknown"} ${profile?.last_initial ?? ""}.`,
    }).catch((err) => console.error("[createJob] Discord failed:", err)),
    logAuditEvent(user.id, "job.created", "job", job.id, {
      title: input.title,
      category: input.category,
    }).catch(() => null),
    // Email confirmation to the poster
    (async () => {
      if (!user.email) return;
      try {
        const email = jobPostedEmail({
          posterFirstName: profile?.first_name ?? "there",
          jobTitle: input.title,
          jobCategory: input.category,
          jobId: job.id,
          price: input.price ?? input.priceMin ?? input.hourlyRate ?? null,
        });
        await sendEmail(user.email, email.subject, email.html);
      } catch (err) {
        console.error("[createJob] Job posted email failed:", err);
      }
    })(),
  ]);

  // Notify Pro/Elite users with matching skills (fire-and-forget)
  (async () => {
    try {
      const { data: matchingGiggers } = await supabase
        .from("nexgigs_skills")
        .select("user_id")
        .eq("skill_category", input.category);

      if (matchingGiggers && matchingGiggers.length > 0) {
        const userIds = Array.from(new Set(matchingGiggers.map((s) => s.user_id)));
        const { data: proUsers } = await supabase
          .from("nexgigs_subscriptions")
          .select("user_id")
          .in("user_id", userIds)
          .eq("status", "active")
          .in("tier", ["pro", "elite"]);

        const toNotify = (proUsers ?? []).slice(0, 20);
        for (const proUser of toNotify) {
          if (proUser.user_id !== user.id) {
            sendNotification({
              userId: proUser.user_id,
              type: "application",
              title: "New job matches your skills!",
              body: `"${input.title}" in ${input.category} was just posted in ${input.city}`,
              link: `/jobs/${job.id}`,
            }).catch(() => {});
          }
        }
      }
    } catch {
      // Silent failure — alerts are best-effort
    }
  })();

  return { job };
}

export async function applyToJob(
  jobId: string,
  bidAmount: number | null,
  message: string
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("first_name, last_initial")
    .eq("id", user.id)
    .single();

  const { data: job } = await supabase
    .from("nexgigs_jobs")
    .select("title, poster_id")
    .eq("id", jobId)
    .single();

  const { error } = await supabase.from("nexgigs_applications").insert({
    job_id: jobId,
    gigger_id: user.id,
    bid_amount: bidAmount,
    message,
  });

  if (error) {
    if (error.code === "23505") return { error: "You already applied to this job" };
    return { error: error.message };
  }

  // Increment application count (atomic, no race condition)
  await supabase.rpc("increment_applications", { job_id_input: jobId });

  // AWAIT Discord + in-app notification + email — fire-and-forget doesn't
  // work reliably on Vercel (pending promises killed when function returns)
  await Promise.all([
    notifyDiscord("job_applied", {
      gigger: `${profile?.first_name ?? "Unknown"} ${profile?.last_initial ?? ""}.`,
      jobTitle: job?.title ?? "Unknown",
      bidAmount: bidAmount ?? 0,
    }).catch((err) => console.error("[applyToJob] Discord failed:", err)),
    logAuditEvent(user.id, "job.applied", "job", jobId).catch(() => null),
    // In-app notification to poster
    job?.poster_id
      ? sendNotification({
          userId: job.poster_id,
          type: "application",
          title: "New application!",
          body: `${profile?.first_name ?? "Someone"} applied to "${job.title}" with a bid of $${bidAmount ?? "open"}`,
          link: `/jobs/${jobId}`,
        }).catch((err) => console.error("[applyToJob] sendNotification failed:", err))
      : Promise.resolve(),
    // Email notification to poster (uses admin client to read their email)
    job?.poster_id
      ? sendPosterApplicationEmail({
          posterId: job.poster_id,
          giggerFirstName: profile?.first_name ?? "A gigger",
          giggerLastInitial: profile?.last_initial ?? "X",
          giggerUserId: user.id,
          jobTitle: job.title ?? "your job",
          jobId,
          bidAmount,
        }).catch((err) => console.error("[applyToJob] Email failed:", err))
      : Promise.resolve(),
  ]);

  return { success: true };
}

/**
 * Helper: fetch the poster's email + applicant's rating/stats and send
 * the "new application" email. Uses the admin client since auth.users
 * is not accessible via the user-scoped client.
 *
 * SECURITY CONTRACT — keep this READ-ONLY.
 * The admin client bypasses Supabase RLS. The only caller of this helper
 * (submitApplication) has already verified the calling user via the
 * user-scoped client and successfully created an application row, which
 * implicitly grants legitimate access to read the poster's contact info.
 * Do NOT add any admin-client INSERT/UPDATE/DELETE here — every write
 * must go through the user-scoped supabase client so RLS stays in the
 * loop.
 */
async function sendPosterApplicationEmail(input: {
  posterId: string;
  giggerFirstName: string;
  giggerLastInitial: string;
  giggerUserId: string;
  jobTitle: string;
  jobId: string;
  bidAmount: number | null;
}): Promise<void> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return; // service role missing
  }

  // Fetch poster's email (from auth.users via admin API)
  const { data: posterAuth } = await admin.auth.admin.getUserById(input.posterId);
  const posterEmail = posterAuth?.user?.email;
  if (!posterEmail) return;

  // Fetch poster's first name
  const { data: posterProfile } = await admin
    .from("nexgigs_profiles")
    .select("first_name")
    .eq("id", input.posterId)
    .maybeSingle();

  // Fetch applicant's rating and gigs completed
  const [{ data: giggerRating }, { data: giggerXp }, { data: giggerProfile }] =
    await Promise.all([
      admin
        .from("nexgigs_user_ratings")
        .select("average_rating")
        .eq("user_id", input.giggerUserId)
        .maybeSingle(),
      admin
        .from("nexgigs_user_xp")
        .select("gigs_completed")
        .eq("user_id", input.giggerUserId)
        .maybeSingle(),
      admin
        .from("nexgigs_profiles")
        .select("city")
        .eq("id", input.giggerUserId)
        .maybeSingle(),
    ]);

  const email = newApplicationEmail({
    posterFirstName: posterProfile?.first_name ?? "there",
    giggerFirstName: input.giggerFirstName,
    giggerLastInitial: input.giggerLastInitial,
    jobTitle: input.jobTitle,
    bidAmount: input.bidAmount,
    jobId: input.jobId,
    giggerRating: giggerRating?.average_rating ?? null,
    giggerGigsCompleted: giggerXp?.gigs_completed ?? null,
    giggerCity: giggerProfile?.city,
  });

  await sendEmail(posterEmail, email.subject, email.html);
}

export async function getMyGigs() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { active: [], applied: [], completed: [], posted: [] };

  // Jobs I'm hired for (active)
  const { data: active } = await supabase
    .from("nexgigs_hired_jobs")
    .select(`
      *,
      job:nexgigs_jobs(*),
      poster:nexgigs_profiles!poster_id(first_name, last_initial)
    `)
    .eq("gigger_id", user.id)
    .eq("status", "active");

  // Jobs I applied to
  const { data: applied } = await supabase
    .from("nexgigs_applications")
    .select(`
      *,
      job:nexgigs_jobs(*)
    `)
    .eq("gigger_id", user.id)
    .eq("status", "pending");

  // Completed jobs
  const { data: completed } = await supabase
    .from("nexgigs_hired_jobs")
    .select(`
      *,
      job:nexgigs_jobs(*),
      poster:nexgigs_profiles!poster_id(first_name, last_initial)
    `)
    .eq("gigger_id", user.id)
    .eq("status", "completed");

  // Jobs I posted (exclude soft-deleted)
  const { data: posted } = await supabase
    .from("nexgigs_jobs")
    .select("*, applications:nexgigs_applications(count)")
    .eq("poster_id", user.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  return {
    active: active ?? [],
    applied: applied ?? [],
    completed: completed ?? [],
    posted: posted ?? [],
  };
}

/**
 * Soft-delete a job posting. Only the poster can do this. Sets status
 * to "cancelled" so the row is preserved for audit/analytics but no
 * longer appears in listings, search, or the poster's own "My Gigs".
 *
 * Refuses to delete if the job has already been hired out (there is an
 * active nexgigs_hired_jobs row) — cancelling mid-gig would break
 * escrow/payment flows. In that case the poster should use the dispute
 * flow instead.
 */
export async function deleteJob(jobId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify ownership
  const { data: job } = await supabase
    .from("nexgigs_jobs")
    .select("id, poster_id, title, status")
    .eq("id", jobId)
    .maybeSingle();

  if (!job) return { error: "Job not found" };
  if (job.poster_id !== user.id) {
    return { error: "You can only delete your own jobs" };
  }
  if (job.status === "cancelled") {
    return { error: "Job is already deleted" };
  }

  // Refuse if there's an active hire on this job
  const { data: activeHire } = await supabase
    .from("nexgigs_hired_jobs")
    .select("id")
    .eq("job_id", jobId)
    .eq("status", "active")
    .maybeSingle();

  if (activeHire) {
    return {
      error:
        "You can't delete a job someone has already been hired for. Use the dispute flow to cancel a hired gig.",
    };
  }

  // Soft delete — set status to cancelled
  const { error } = await supabase
    .from("nexgigs_jobs")
    .update({ status: "cancelled" })
    .eq("id", jobId);

  if (error) return { error: error.message };

  // Reject any still-pending applications so giggers see the job is gone
  await supabase
    .from("nexgigs_applications")
    .update({ status: "rejected" })
    .eq("job_id", jobId)
    .eq("status", "pending");

  await logAuditEvent(user.id, "job.deleted", "job", jobId, {
    title: job.title,
  });

  return { success: true };
}
