"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

// XP cost for each redeemable reward
const REDEEMABLE_REWARDS = {
  custom_badge_color: { xp: 500, type: "badge", description: "Custom Badge Color" },
  trusted_badge: { xp: 2000, type: "badge", description: "Trusted Badge" },
  gold_profile_7d: { xp: 5000, type: "boost", description: "Gold Profile (7 days)" },
  nexgigs_pro_badge: { xp: 10000, type: "badge", description: "NexGigs Pro Badge" },
  credit_5: { xp: 25000, type: "credit", description: "$5 NexGigs Credit", creditAmount: 5 },
  credit_10: { xp: 50000, type: "credit", description: "$10 NexGigs Credit", creditAmount: 10 },
  credit_25: { xp: 100000, type: "credit", description: "$25 NexGigs Credit", creditAmount: 25 },
} as const;

type RewardKey = keyof typeof REDEEMABLE_REWARDS;

export async function redeemReward(rewardKey: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const reward = REDEEMABLE_REWARDS[rewardKey as RewardKey];
  if (!reward) return { error: "Invalid reward" };

  // Check user's XP
  const { data: xpData } = await supabase
    .from("nexgigs_user_xp")
    .select("total_xp")
    .eq("user_id", user.id)
    .single();

  const currentXp = xpData?.total_xp ?? 0;
  if (currentXp < reward.xp) {
    return { error: `Not enough XP. You need ${reward.xp} XP but have ${currentXp}.` };
  }

  // Check if already redeemed (for badges — one-time only)
  if (reward.type === "badge") {
    const { data: existing } = await supabase
      .from("nexgigs_credits")
      .select("id")
      .eq("user_id", user.id)
      .eq("description", reward.description)
      .eq("type", "redeemed")
      .maybeSingle();

    if (existing) return { error: "You already have this badge." };
  }

  // Deduct XP
  const { error: updateError } = await supabase
    .from("nexgigs_user_xp")
    .update({ total_xp: currentXp - reward.xp })
    .eq("user_id", user.id);

  if (updateError) {
    return { error: "Failed to deduct XP. Please try again." };
  }

  // Log the XP spend
  await supabase.from("nexgigs_xp").insert({
    user_id: user.id,
    xp_amount: -reward.xp,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action_type: "reward_redeemed" as any, // Not in XP_ACTIONS enum but valid for logging
    description: `Redeemed: ${reward.description}`,
  });

  // If it's a credit reward, add to credits table
  if (reward.type === "credit" && "creditAmount" in reward) {
    await supabase.from("nexgigs_credits").insert({
      user_id: user.id,
      amount: reward.creditAmount,
      type: "earned",
      description: reward.description,
      xp_spent: reward.xp,
    });
  } else {
    // For badges/boosts, log the redemption
    await supabase.from("nexgigs_credits").insert({
      user_id: user.id,
      amount: 0,
      type: "redeemed",
      description: reward.description,
      xp_spent: reward.xp,
    });
  }

  // Audit log
  await logAuditEvent(
    user.id,
    "shop.reward_redeemed",
    "reward",
    rewardKey,
    { reward: reward.description, xpSpent: reward.xp }
  );

  return { success: true, xpSpent: reward.xp, newXp: currentXp - reward.xp };
}

export async function getCreditBalance() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { balance: 0, history: [] };

  const { data } = await supabase
    .from("nexgigs_credits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const balance = (data ?? []).reduce((sum, row) => {
    if (row.type === "earned") return sum + Number(row.amount);
    if (row.type === "redeemed" && Number(row.amount) > 0) return sum - Number(row.amount);
    return sum;
  }, 0);

  return { balance, history: data ?? [] };
}
