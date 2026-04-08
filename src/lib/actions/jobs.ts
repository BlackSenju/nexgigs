"use server";

import { createClient } from "@/lib/supabase/server";
import { moderateJobPosting } from "@/lib/moderation";
import { aiModerateContent } from "@/lib/ai";
import { notifyDiscord } from "@/lib/discord";
import { logAuditEvent } from "@/lib/audit";
import { geocodeAddress } from "@/lib/geocode";

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
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters?.state) {
    query = query.eq("state", filters.state.toUpperCase());
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  } else {
    query = query.limit(50);
  }

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

  // Fire-and-forget notifications
  Promise.all([
    notifyDiscord("job_posted", {
      title: input.title,
      category: input.category,
      price: displayPrice,
      city: input.city,
      state: input.state,
      poster: `${profile?.first_name ?? "Unknown"} ${profile?.last_initial ?? ""}.`,
    }),
    logAuditEvent(user.id, "job.created", "job", job.id, {
      title: input.title,
      category: input.category,
    }),
  ]).catch(() => {});

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

  // Increment application count
  // Atomic application count increment (no race condition)
  await supabase.rpc("increment_applications", { job_id_input: jobId });

  // Fire-and-forget
  Promise.all([
    notifyDiscord("job_applied", {
      gigger: `${profile?.first_name ?? "Unknown"} ${profile?.last_initial ?? ""}.`,
      jobTitle: job?.title ?? "Unknown",
      bidAmount: bidAmount ?? 0,
    }),
    logAuditEvent(user.id, "job.applied", "job", jobId),
  ]).catch(() => {});

  return { success: true };
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

  // Jobs I posted
  const { data: posted } = await supabase
    .from("nexgigs_jobs")
    .select("*, applications:nexgigs_applications(count)")
    .eq("poster_id", user.id)
    .order("created_at", { ascending: false });

  return {
    active: active ?? [],
    applied: applied ?? [],
    completed: completed ?? [],
    posted: posted ?? [],
  };
}
