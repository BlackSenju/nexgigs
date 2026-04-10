"use server";

import { createClient } from "@/lib/supabase/server";
import { checkAIUsage, recordAIUsage } from "@/lib/actions/ai-usage";

interface JobMatch {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number | null;
  hourly_rate: number | null;
  city: string | null;
  state: string | null;
  status: string;
  created_at: string;
  applications_count: number | null;
  poster: { first_name: string; last_initial: string } | null;
  matchScore: number;
}

interface MatchReason {
  jobId: string;
  reason: string;
}

interface JobMatchResult {
  matches?: JobMatch[];
  reasons?: MatchReason[];
  skillsUsed?: string[];
  message?: string;
  error?: string;
  usage?: { remaining: number; limit: number };
}

export async function getAIJobMatches(): Promise<JobMatchResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Check tier - only elite
  const { data: sub } = await supabase
    .from("nexgigs_subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  if (sub?.tier !== "elite") {
    return { error: "AI Job Matching requires Elite subscription" };
  }

  // Check AI usage
  const usageCheck = await checkAIUsage("matching");
  if (!usageCheck.allowed) {
    return {
      error: "Daily matching limit reached. Try again tomorrow.",
      usage: { remaining: 0, limit: usageCheck.limit },
    };
  }

  // Get user's skills and profile
  const [{ data: skills }, { data: profile }] = await Promise.all([
    supabase
      .from("nexgigs_skills")
      .select("skill_name, skill_category")
      .eq("user_id", user.id),
    supabase
      .from("nexgigs_profiles")
      .select("city, state")
      .eq("id", user.id)
      .single(),
  ]);

  const userSkills = (skills ?? []).map((s) => s.skill_name);
  const userCategories = Array.from(
    new Set((skills ?? []).map((s) => s.skill_category))
  );
  const userCity = profile?.city ?? "";
  const userState = profile?.state ?? "";

  // Get open jobs, prioritizing user's location and categories
  const { data: jobs } = await supabase
    .from("nexgigs_jobs")
    .select(
      `
      id, title, description, category, price, hourly_rate,
      city, state, status, created_at, applications_count,
      poster:nexgigs_profiles!poster_id(first_name, last_initial)
    `
    )
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!jobs || jobs.length === 0) {
    return {
      matches: [],
      message: "No open jobs found right now. Check back later!",
      usage: { remaining: usageCheck.remaining, limit: usageCheck.limit },
    };
  }

  // Score jobs based on skill/category/location match
  const scoredJobs: JobMatch[] = jobs.map((job) => {
    let score = 0;

    // Category match
    if (userCategories.includes(job.category)) score += 30;

    // Location match
    if (
      job.city &&
      userCity &&
      job.city.toLowerCase() === userCity.toLowerCase()
    )
      score += 20;
    if (
      job.state &&
      userState &&
      job.state.toLowerCase() === userState.toLowerCase()
    )
      score += 10;

    // Fewer applications = better opportunity
    if ((job.applications_count ?? 0) < 3) score += 15;
    if ((job.applications_count ?? 0) === 0) score += 10;

    // Recent jobs preferred
    const daysOld =
      (Date.now() - new Date(job.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysOld < 1) score += 15;
    else if (daysOld < 3) score += 10;
    else if (daysOld < 7) score += 5;

    return {
      ...job,
      poster: Array.isArray(job.poster) ? job.poster[0] ?? null : job.poster,
      matchScore: score,
    };
  });

  // Sort by score descending and take top 10 (immutable)
  const topMatches = [...scoredJobs]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  // Record AI usage
  await recordAIUsage("matching");

  // Generate match reasons for top 3
  const matchReasons: MatchReason[] = topMatches.slice(0, 3).map((job) => {
    const reasons: string[] = [];
    if (userCategories.includes(job.category))
      reasons.push(`matches your ${job.category} skills`);
    if (
      job.city &&
      userCity &&
      job.city.toLowerCase() === userCity.toLowerCase()
    )
      reasons.push("in your city");
    if ((job.applications_count ?? 0) < 3)
      reasons.push("few applicants \u2014 great opportunity");
    const daysOld =
      (Date.now() - new Date(job.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysOld < 1) reasons.push("just posted");
    return {
      jobId: job.id,
      reason: reasons.join(", ") || "good match for your profile",
    };
  });

  return {
    matches: topMatches,
    reasons: matchReasons,
    skillsUsed: userSkills,
    message: `Found ${topMatches.length} jobs matching your skills`,
    usage: {
      remaining: Math.max(0, usageCheck.remaining - 1),
      limit: usageCheck.limit,
    },
  };
}
