"use server";

import { createClient } from "@/lib/supabase/server";
import { XP_ACTIONS, LEVELS } from "@/lib/constants";
import { notifyDiscord } from "@/lib/discord";

type XPAction = keyof typeof XP_ACTIONS;

// Daily XP cap per user (prevents gaming)
const DAILY_XP_CAP = 1000;

// Cooldown: max times an action can award XP per day
const ACTION_DAILY_LIMITS: Partial<Record<XPAction, number>> = {
  gig_complete: 10,        // Max 10 gig completions per day (1000 XP)
  five_star_rating: 5,     // Max 5 five-star ratings per day (375 XP)
  detailed_review_left: 5, // Max 5 reviews per day (250 XP)
};

// One-time actions that can only ever be awarded once
const ONE_TIME_ACTIONS: XPAction[] = [
  "first_gig_ever",
  "first_job_posted",
  "five_gigs_milestone",
  "ten_gigs_milestone",
  "twentyfive_gigs_milestone",
  "fifty_gigs_milestone",
];

/**
 * Award XP to a user for a specific action.
 * Includes rate limiting: daily XP cap + per-action cooldowns.
 */
export async function awardXP(
  userId: string,
  action: XPAction,
  jobId?: string
) {
  const supabase = createClient();
  const xpAmount = XP_ACTIONS[action];

  // Check one-time actions — don't award twice
  if (ONE_TIME_ACTIONS.includes(action)) {
    const { data: existing } = await supabase
      .from("nexgigs_xp")
      .select("id")
      .eq("user_id", userId)
      .eq("action_type", action)
      .maybeSingle();

    if (existing) {
      return { xpAwarded: 0, reason: "Already awarded" };
    }
  }

  // Check daily XP cap
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todayXp } = await supabase
    .from("nexgigs_xp")
    .select("xp_amount")
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString());

  const totalToday = (todayXp ?? []).reduce((sum, row) => sum + Number(row.xp_amount), 0);

  if (totalToday >= DAILY_XP_CAP) {
    return { xpAwarded: 0, reason: "Daily XP cap reached" };
  }

  // Check per-action daily limit
  const actionLimit = ACTION_DAILY_LIMITS[action];
  if (actionLimit) {
    const { count } = await supabase
      .from("nexgigs_xp")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action_type", action)
      .gte("created_at", todayStart.toISOString());

    if ((count ?? 0) >= actionLimit) {
      return { xpAwarded: 0, reason: `Daily ${action} limit reached` };
    }
  }

  // Log XP event
  await supabase.from("nexgigs_xp").insert({
    user_id: userId,
    xp_amount: xpAmount,
    action_type: action,
    job_id: jobId,
    description: formatActionDescription(action),
  });

  // Get current XP
  const { data: currentXp } = await supabase
    .from("nexgigs_user_xp")
    .select("*")
    .eq("user_id", userId)
    .single();

  const newTotalXp = (currentXp?.total_xp ?? 0) + xpAmount;
  const newGigsCompleted =
    (currentXp?.gigs_completed ?? 0) +
    (action === "gig_complete" || action === "first_gig_ever" ? 1 : 0);
  const newJobsPosted =
    (currentXp?.jobs_posted ?? 0) +
    (action === "first_job_posted" ? 1 : 0);

  // Calculate new level
  const newLevel = calculateLevel(newTotalXp);
  const previousLevel = currentXp?.current_level ?? 1;

  // Update user XP
  await supabase.from("nexgigs_user_xp").upsert({
    user_id: userId,
    total_xp: newTotalXp,
    current_level: newLevel.level,
    level_title: newLevel.title,
    xp_to_next_level: newLevel.xpToNext,
    gigs_completed: newGigsCompleted,
    jobs_posted: newJobsPosted,
    last_gig_date:
      action === "gig_complete"
        ? new Date().toISOString().split("T")[0]
        : currentXp?.last_gig_date,
    last_updated: new Date().toISOString(),
  });

  // Notify on level up
  if (newLevel.level > previousLevel) {
    notifyDiscord("subscription_upgraded", {
      name: userId,
      tier: `Level ${newLevel.level}: ${newLevel.title}`,
      price: 0,
    }).catch(() => {});
  }

  return { xpAwarded: xpAmount, newTotal: newTotalXp, level: newLevel };
}

function calculateLevel(totalXp: number): {
  level: number;
  title: string;
  xpToNext: number;
} {
  let levelIdx = 0;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].xp_required) {
      levelIdx = i;
      break;
    }
  }

  const current = LEVELS[levelIdx];
  const next = LEVELS[levelIdx + 1];

  return {
    level: current.level,
    title: current.title,
    xpToNext: next ? next.xp_required - totalXp : 0,
  };
}

function formatActionDescription(action: XPAction): string {
  const descriptions: Record<XPAction, string> = {
    first_gig_ever: "Completed first gig ever!",
    gig_complete: "Completed a gig",
    five_star_rating: "Received a 5-star rating",
    five_gigs_milestone: "Completed 5 gigs milestone",
    ten_gigs_milestone: "Completed 10 gigs milestone",
    twentyfive_gigs_milestone: "Completed 25 gigs milestone",
    fifty_gigs_milestone: "Completed 50 gigs milestone",
    repeat_customer: "Earned a repeat customer",
    zero_cancellations_month: "Zero cancellations this month",
    first_job_posted: "Posted first job",
    detailed_review_left: "Left a detailed review",
  };
  return descriptions[action];
}

/**
 * Check and award milestone XP based on gig count.
 */
export async function checkMilestones(userId: string) {
  const supabase = createClient();
  const { data: xp } = await supabase
    .from("nexgigs_user_xp")
    .select("gigs_completed")
    .eq("user_id", userId)
    .single();

  const gigsCompleted = xp?.gigs_completed ?? 0;

  // Check milestones
  const milestones: Array<{ count: number; action: XPAction }> = [
    { count: 5, action: "five_gigs_milestone" },
    { count: 10, action: "ten_gigs_milestone" },
    { count: 25, action: "twentyfive_gigs_milestone" },
    { count: 50, action: "fifty_gigs_milestone" },
  ];

  for (const m of milestones) {
    if (gigsCompleted === m.count) {
      // Check if already awarded
      const { data: existing } = await supabase
        .from("nexgigs_xp")
        .select("id")
        .eq("user_id", userId)
        .eq("action_type", m.action)
        .maybeSingle();

      if (!existing) {
        await awardXP(userId, m.action);
      }
    }
  }
}
