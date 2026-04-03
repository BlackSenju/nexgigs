"use server";

import { createClient } from "@/lib/supabase/server";
import { notifyDiscord } from "@/lib/discord";
import { logAuditEvent } from "@/lib/audit";
import { awardXP } from "@/lib/actions/xp";

export async function submitRating(input: {
  hiredJobId: string;
  rateeId: string;
  qualityScore: number;
  punctualityScore: number;
  communicationScore: number;
  wouldHireAgain: boolean;
  reviewText?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify user is a participant of this hired job
  const { data: hiredJob } = await supabase
    .from("nexgigs_hired_jobs")
    .select("poster_id, gigger_id")
    .eq("id", input.hiredJobId)
    .single();

  if (!hiredJob) return { error: "Job not found" };
  if (hiredJob.poster_id !== user.id && hiredJob.gigger_id !== user.id) {
    return { error: "Not authorized to rate this job" };
  }

  const raterType =
    hiredJob.poster_id === user.id ? "poster" : "gigger";

  // Check for duplicate rating
  const { data: existing } = await supabase
    .from("nexgigs_ratings")
    .select("id")
    .eq("job_id", input.hiredJobId)
    .eq("rater_id", user.id)
    .maybeSingle();

  if (existing) return { error: "You already rated this job" };

  // Insert rating
  const { error } = await supabase.from("nexgigs_ratings").insert({
    job_id: input.hiredJobId,
    rater_id: user.id,
    ratee_id: input.rateeId,
    rater_type: raterType,
    quality_score: input.qualityScore,
    punctuality_score: input.punctualityScore,
    communication_score: input.communicationScore,
    would_hire_again: input.wouldHireAgain,
    review_text: input.reviewText,
  });

  if (error) return { error: error.message };

  // Update aggregate ratings
  await updateUserRatings(input.rateeId);

  // Award XP for leaving a detailed review
  if (input.reviewText && input.reviewText.length > 20) {
    await awardXP(user.id, "detailed_review_left");
  }

  // Check if rated 5 stars — award XP to ratee
  const avgScore =
    (input.qualityScore + input.punctualityScore + input.communicationScore) / 3;
  if (avgScore >= 4.5) {
    await awardXP(input.rateeId, "five_star_rating");
  }

  Promise.all([
    notifyDiscord("rating_submitted", {
      rater: user.id,
      ratee: input.rateeId,
      rating: avgScore,
      jobId: input.hiredJobId,
    }),
    logAuditEvent(user.id, "rating.submitted", "rating", input.hiredJobId, {
      score: avgScore,
      rateeId: input.rateeId,
    }),
  ]).catch(() => {});

  return { success: true };
}

async function updateUserRatings(userId: string) {
  const supabase = createClient();

  const { data: ratings } = await supabase
    .from("nexgigs_ratings")
    .select("overall_score, would_hire_again, quality_score")
    .eq("ratee_id", userId);

  if (!ratings || ratings.length === 0) return;

  const totalRatings = ratings.length;
  const avgRating =
    ratings.reduce((sum, r) => sum + Number(r.overall_score ?? 0), 0) /
    totalRatings;
  const fiveStarCount = ratings.filter(
    (r) => Number(r.overall_score) >= 4.5
  ).length;
  const oneStarCount = ratings.filter(
    (r) => Number(r.overall_score) <= 1.5
  ).length;
  const wouldHireAgainCount = ratings.filter((r) => r.would_hire_again).length;
  const wouldHireAgainPct = (wouldHireAgainCount / totalRatings) * 100;

  // Determine badge tier
  let badgeTier = "new";
  if (totalRatings >= 50 && avgRating >= 4.5) badgeTier = "elite";
  else if (totalRatings >= 25 && avgRating >= 4.0) badgeTier = "gold";
  else if (totalRatings >= 10 && avgRating >= 3.5) badgeTier = "silver";
  else if (totalRatings >= 5) badgeTier = "bronze";

  await supabase
    .from("nexgigs_user_ratings")
    .upsert({
      user_id: userId,
      average_rating: Math.round(avgRating * 10) / 10,
      total_ratings: totalRatings,
      five_star_count: fiveStarCount,
      one_star_count: oneStarCount,
      would_hire_again_percentage: Math.round(wouldHireAgainPct),
      badge_tier: badgeTier,
      last_updated: new Date().toISOString(),
    });
}
