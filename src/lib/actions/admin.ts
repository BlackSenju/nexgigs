"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Check if current user is admin.
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("nexgigs_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return data?.is_admin === true;
}

/**
 * Get platform stats for admin dashboard.
 */
export async function getAdminStats() {
  const supabase = createClient();

  const [users, jobs, , revenue, ghostReports] = await Promise.all([
    supabase.from("nexgigs_profiles").select("id", { count: "exact", head: true }),
    supabase.from("nexgigs_jobs").select("id", { count: "exact", head: true }),
    supabase.from("nexgigs_hired_jobs").select("id, agreed_price, status"),
    supabase.from("nexgigs_hired_jobs").select("agreed_price").eq("status", "completed"),
    supabase.from("nexgigs_ghost_reports").select("id", { count: "exact", head: true }),
  ]);

  const totalRevenue = (revenue.data ?? []).reduce(
    (sum, h) => sum + Number(h.agreed_price ?? 0), 0
  );

  const activeJobs = await supabase
    .from("nexgigs_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  const completedJobs = await supabase
    .from("nexgigs_hired_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed");

  return {
    totalUsers: users.count ?? 0,
    totalJobs: jobs.count ?? 0,
    activeJobs: activeJobs.count ?? 0,
    completedJobs: completedJobs.count ?? 0,
    totalRevenue,
    ghostReports: ghostReports.count ?? 0,
  };
}

/**
 * Get recent users for admin.
 */
export async function getAdminUsers(limit = 20) {
  const supabase = createClient();

  const { data } = await supabase
    .from("nexgigs_profiles")
    .select(`
      id, first_name, last_initial, city, state, verification_tier,
      identity_verified, background_checked, is_admin, is_gigger, is_poster,
      avatar_url, created_at
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

/**
 * Get recent jobs for admin moderation.
 */
export async function getAdminJobs(limit = 20) {
  const supabase = createClient();

  const { data } = await supabase
    .from("nexgigs_jobs")
    .select(`
      id, title, category, city, state, status, price, hourly_rate,
      applications_count, views_count, is_urgent, created_at,
      poster:nexgigs_profiles!poster_id(first_name, last_initial)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

/**
 * Get ghost reports for admin review.
 */
export async function getAdminGhostReports(limit = 20) {
  const supabase = createClient();

  const { data } = await supabase
    .from("nexgigs_ghost_reports")
    .select(`
      id, ghost_type, description, created_at,
      reporter:nexgigs_profiles!reporter_id(first_name, last_initial),
      reported:nexgigs_profiles!reported_id(first_name, last_initial, id)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

/**
 * Get recent audit log entries.
 */
export async function getAdminAuditLog(limit = 50) {
  const supabase = createClient();

  const { data } = await supabase
    .from("nexgigs_audit_log")
    .select(`
      id, action, resource_type, resource_id, metadata, created_at,
      user:nexgigs_profiles!user_id(first_name, last_initial)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

/**
 * Admin: delete a job.
 */
export async function adminDeleteJob(jobId: string) {
  const admin = await isAdmin();
  if (!admin) return { error: "Not authorized" };

  const supabase = createClient();
  const { error } = await supabase
    .from("nexgigs_jobs")
    .delete()
    .eq("id", jobId);

  return error ? { error: error.message } : { success: true };
}

/**
 * Admin: suspend a user (set verification_tier to 'suspended').
 */
export async function adminSuspendUser(userId: string) {
  const admin = await isAdmin();
  if (!admin) return { error: "Not authorized" };

  const supabase = createClient();
  const { error } = await supabase
    .from("nexgigs_profiles")
    .update({ verification_tier: "suspended" })
    .eq("id", userId);

  return error ? { error: error.message } : { success: true };
}

/**
 * Admin: unsuspend a user.
 */
export async function adminUnsuspendUser(userId: string) {
  const admin = await isAdmin();
  if (!admin) return { error: "Not authorized" };

  const supabase = createClient();
  const { error } = await supabase
    .from("nexgigs_profiles")
    .update({ verification_tier: "basic" })
    .eq("id", userId);

  return error ? { error: error.message } : { success: true };
}
