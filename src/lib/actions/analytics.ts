"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Track a unique view on a job. Increments total views always,
 * unique views only on first visit per user.
 */
export async function trackJobView(jobId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await supabase.rpc("track_unique_view", {
      job_id_input: jobId,
      viewer_id_input: user.id,
    });
  } else {
    // Anonymous view — just increment total
    await supabase.rpc("increment_views", { job_id_input: jobId });
  }
}

/**
 * Update time spent viewing a job (called when user leaves the page).
 */
export async function trackViewDuration(jobId: string, seconds: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || seconds < 1) return;

  await supabase.rpc("update_view_duration", {
    job_id_input: jobId,
    viewer_id_input: user.id,
    seconds_input: Math.min(seconds, 3600), // cap at 1 hour
  });
}

/**
 * Toggle save/bookmark on a job. Returns whether the job is now saved.
 */
export async function toggleSaveJob(jobId: string): Promise<{ saved: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { saved: false, error: "Not authenticated" };

  const { data, error } = await supabase.rpc("toggle_save_job", {
    job_id_input: jobId,
    user_id_input: user.id,
  });

  if (error) return { saved: false, error: error.message };
  return { saved: Boolean(data) };
}

/**
 * Check if the current user has saved a specific job.
 */
export async function isJobSaved(jobId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("nexgigs_saved_jobs")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  return !!data;
}

/**
 * Get all saved jobs for the current user.
 */
export async function getSavedJobs() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("nexgigs_saved_jobs")
    .select(`
      job_id,
      created_at,
      job:nexgigs_jobs(
        id, title, category, city, neighborhood, price, price_min, price_max,
        hourly_rate, duration_type, is_urgent, status, applications_count,
        views_count, created_at,
        poster:nexgigs_profiles!poster_id(first_name, last_initial)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

/**
 * Get job analytics for a poster (conversion rates, view data).
 */
export async function getJobAnalytics(jobId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Verify poster owns this job
  const { data: job } = await supabase
    .from("nexgigs_jobs")
    .select("poster_id, views_count, unique_views, applications_count, saves_count")
    .eq("id", jobId)
    .single();

  if (!job || job.poster_id !== user.id) return null;

  // Get view duration stats
  const { data: viewStats } = await supabase
    .from("nexgigs_job_views")
    .select("duration_seconds")
    .eq("job_id", jobId);

  const durations = (viewStats ?? []).map((v) => v.duration_seconds).filter((d) => d > 0);
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const totalViews = Number(job.views_count ?? 0);
  const uniqueViews = Number(job.unique_views ?? 0);
  const applications = Number(job.applications_count ?? 0);
  const saves = Number(job.saves_count ?? 0);

  return {
    totalViews,
    uniqueViews,
    applications,
    saves,
    avgViewDuration: avgDuration,
    viewToApplyRate: uniqueViews > 0
      ? Math.round((applications / uniqueViews) * 100)
      : 0,
    viewToSaveRate: uniqueViews > 0
      ? Math.round((saves / uniqueViews) * 100)
      : 0,
  };
}
