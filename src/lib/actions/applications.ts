"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

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

  const { error } = await supabase
    .from("nexgigs_applications")
    .update({ status: "rejected" })
    .eq("id", applicationId);

  return error ? { error: error.message } : { success: true };
}
