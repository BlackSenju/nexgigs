"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateDistance } from "@/lib/distance";

interface MatchResult {
  id: string;
  first_name: string;
  last_initial: string;
  avatar_url: string | null;
  city: string;
  state: string;
  bio: string | null;
  gigs_completed: number;
  average_rating: number;
  total_ratings: number;
  distance: number | null;
  matchScore: number;
  matchType: "best" | "rising_star" | "new_nearby";
  matchReason: string;
  skills: string[];
}

export async function findInstantMatches(
  jobId: string
): Promise<{ matches: MatchResult[]; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { matches: [], error: "Not authenticated" };

  // Get the job details
  const { data: job } = await supabase
    .from("nexgigs_jobs")
    .select(
      "id, category, city, state, latitude, longitude, poster_id, title"
    )
    .eq("id", jobId)
    .single();

  if (!job) return { matches: [], error: "Job not found" };
  if (job.poster_id !== user.id)
    return { matches: [], error: "Not your job" };

  // Find giggers with matching skills
  const { data: matchingSkills } = await supabase
    .from("nexgigs_skills")
    .select("user_id, skill_name")
    .eq("skill_category", job.category);

  const giggerIds = Array.from(
    new Set((matchingSkills ?? []).map((s) => s.user_id))
  );

  if (giggerIds.length === 0) {
    // Fallback: get any giggers in the same city
    const { data: localGiggers } = await supabase
      .from("nexgigs_profiles")
      .select("id")
      .eq("is_gigger", true)
      .eq("city", job.city)
      .neq("id", user.id)
      .limit(20);
    giggerIds.push(...(localGiggers ?? []).map((g) => g.id));
  }

  if (giggerIds.length === 0)
    return {
      matches: [],
      error: "No matching giggers found in your area yet",
    };

  // Remove the poster from matches
  const filteredIds = giggerIds.filter((id) => id !== user.id);

  if (filteredIds.length === 0)
    return {
      matches: [],
      error: "No matching giggers found in your area yet",
    };

  // Fetch full profiles, XP, and ratings for all candidates
  const candidateIds = filteredIds.slice(0, 50);

  const [{ data: profiles }, { data: xpData }, { data: ratingData }] =
    await Promise.all([
      supabase
        .from("nexgigs_profiles")
        .select(
          "id, first_name, last_initial, avatar_url, city, state, bio, latitude, longitude, created_at"
        )
        .in("id", candidateIds),
      supabase
        .from("nexgigs_user_xp")
        .select("user_id, gigs_completed, total_xp")
        .in("user_id", candidateIds),
      supabase
        .from("nexgigs_user_ratings")
        .select("user_id, average_rating, total_ratings")
        .in("user_id", candidateIds),
    ]);

  // Check active job counts (no monopoly)
  const { data: activeJobs } = await supabase
    .from("nexgigs_hired_jobs")
    .select("gigger_id")
    .in("gigger_id", candidateIds)
    .eq("status", "active");

  const activeJobCounts: Record<string, number> = {};
  for (const aj of activeJobs ?? []) {
    activeJobCounts[aj.gigger_id] =
      (activeJobCounts[aj.gigger_id] ?? 0) + 1;
  }

  // Build skill map (immutable accumulation)
  const skillMap: Record<string, string[]> = {};
  for (const s of matchingSkills ?? []) {
    skillMap[s.user_id] = [...(skillMap[s.user_id] ?? []), s.skill_name];
  }

  // Score all candidates
  const scored: MatchResult[] = (profiles ?? []).map((profile) => {
    const xp = xpData?.find((x) => x.user_id === profile.id);
    const rating = ratingData?.find((r) => r.user_id === profile.id);
    const gigsCompleted = xp?.gigs_completed ?? 0;
    const avgRating = Number(rating?.average_rating ?? 0);
    const totalRatings = rating?.total_ratings ?? 0;
    const activeCount = activeJobCounts[profile.id] ?? 0;

    // Calculate distance
    let distance: number | null = null;
    if (
      job.latitude &&
      job.longitude &&
      profile.latitude &&
      profile.longitude
    ) {
      distance = calculateDistance(
        Number(job.latitude),
        Number(job.longitude),
        Number(profile.latitude),
        Number(profile.longitude)
      );
    }

    // Scoring (0-100)
    let score = 0;

    // Skills (30 points max)
    const skills = skillMap[profile.id] ?? [];
    score += Math.min(skills.length * 10, 30);

    // Rating (25 points max)
    score += avgRating * 5;

    // Distance (20 points max — closer is better)
    if (distance !== null) {
      score += Math.max(0, 20 - distance * 2);
    } else if (
      profile.city?.toLowerCase() === job.city?.toLowerCase()
    ) {
      score += 10; // Same city bonus
    }

    // Experience (15 points max)
    score += Math.min(gigsCompleted * 1.5, 15);

    // Activity penalty for overloaded giggers
    if (activeCount >= 5) score -= 30;
    else if (activeCount >= 3) score -= 10;

    // New user boost (first 30 days)
    const daysSinceJoin =
      (Date.now() - new Date(profile.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    const isNew = daysSinceJoin <= 30;
    if (isNew) score += 5;

    // Determine match type
    let matchType: "best" | "rising_star" | "new_nearby" = "best";
    if (gigsCompleted === 0 || isNew) matchType = "new_nearby";
    else if (gigsCompleted < 10 && gigsCompleted > 0)
      matchType = "rising_star";

    // Generate reason
    const reasons: string[] = [];
    if (skills.length > 0) reasons.push(`${job.category} skills`);
    if (distance !== null && distance < 3)
      reasons.push(`${distance.toFixed(1)} mi away`);
    else if (profile.city?.toLowerCase() === job.city?.toLowerCase())
      reasons.push("in your city");
    if (avgRating >= 4.5 && totalRatings >= 3)
      reasons.push(`${avgRating.toFixed(1)} star rating`);
    if (gigsCompleted > 0)
      reasons.push(`${gigsCompleted} gigs completed`);
    if (isNew) reasons.push("new to NexGigs");

    return {
      id: profile.id,
      first_name: profile.first_name,
      last_initial: profile.last_initial,
      avatar_url: profile.avatar_url,
      city: profile.city,
      state: profile.state,
      bio: profile.bio,
      gigs_completed: gigsCompleted,
      average_rating: avgRating,
      total_ratings: totalRatings,
      distance,
      matchScore: Math.max(0, Math.round(score)),
      matchType,
      matchReason: reasons.join(" \u00B7 ") || "matches your job",
      skills,
    };
  });

  // Sort by score (immutable)
  const sorted = [...scored].sort((a, b) => b.matchScore - a.matchScore);

  // Filter out giggers with 5+ active jobs
  const eligible = sorted.filter(
    (s) => (activeJobCounts[s.id] ?? 0) < 5
  );

  // Pick 3 using fair slots
  const bestMatch =
    eligible.find((s) => s.matchType === "best") ?? eligible[0];
  const risingStar = eligible.find(
    (s) => s.matchType === "rising_star" && s.id !== bestMatch?.id
  );
  const newNearby = eligible.find(
    (s) =>
      s.matchType === "new_nearby" &&
      s.id !== bestMatch?.id &&
      s.id !== risingStar?.id
  );

  const matches: MatchResult[] = [];

  if (bestMatch) {
    matches.push({ ...bestMatch, matchType: "best" });
  }

  if (risingStar) {
    matches.push({ ...risingStar, matchType: "rising_star" });
  } else {
    // No rising star found — pick next best that isn't already selected
    const next = eligible.find(
      (s) => s.id !== bestMatch?.id && s.id !== newNearby?.id
    );
    if (next) matches.push({ ...next, matchType: "rising_star" });
  }

  if (newNearby) {
    matches.push({ ...newNearby, matchType: "new_nearby" });
  } else {
    const next = eligible.find((s) => !matches.some((m) => m.id === s.id));
    if (next) matches.push({ ...next, matchType: "new_nearby" });
  }

  return { matches };
}
