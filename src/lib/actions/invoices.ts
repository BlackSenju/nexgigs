"use server";

import { createClient } from "@/lib/supabase/server";

export async function getInvoiceData(hiredJobId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check tier
  const { data: sub } = await supabase
    .from("nexgigs_subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  if (!["business_growth", "enterprise"].includes(sub?.tier ?? "")) {
    return { error: "Invoice generation requires Business Growth or Enterprise" };
  }

  // Fetch hired job with related data
  const { data: hiredJob } = await supabase
    .from("nexgigs_hired_jobs")
    .select(
      `
      *,
      job:nexgigs_jobs!job_id(id, title, category, description),
      gigger:nexgigs_profiles!gigger_id(first_name, last_initial, city, state),
      poster:nexgigs_profiles!poster_id(first_name, last_initial, city, state, business_name)
    `
    )
    .eq("id", hiredJobId)
    .single();

  if (!hiredJob) return { error: "Job not found" };
  if (hiredJob.poster_id !== user.id) return { error: "Not authorized" };

  return { invoice: hiredJob };
}

export async function getCompletedJobs() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("nexgigs_hired_jobs")
    .select(
      `
      id, agreed_price, status, created_at, completed_at,
      job:nexgigs_jobs!job_id(title, category),
      gigger:nexgigs_profiles!gigger_id(first_name, last_initial)
    `
    )
    .eq("poster_id", user.id)
    .in("status", ["completed", "payment_released"])
    .order("completed_at", { ascending: false });

  return data ?? [];
}
