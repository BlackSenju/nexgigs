"use server";

import { createClient } from "@/lib/supabase/server";

const TIER_LIMITS: Record<string, Record<string, number>> = {
  free: { tips: 3, rewrite: 1, matching: 0, pricing: 0 },
  pro: { tips: 10, rewrite: 999, matching: 0, pricing: 3 },
  elite: { tips: 999, rewrite: 999, matching: 5, pricing: 999 },
  business_starter: { tips: 5, rewrite: 3, matching: 0, pricing: 1 },
  business_growth: { tips: 999, rewrite: 999, matching: 0, pricing: 999 },
  enterprise: { tips: 999, rewrite: 999, matching: 999, pricing: 999 },
};

export async function checkAIUsage(
  feature: string
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: string;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, remaining: 0, limit: 0, tier: "free" };
  }

  // Get user's subscription tier
  const { data: sub } = await supabase
    .from("nexgigs_subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const tier = sub?.tier ?? "free";
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
  const limit = limits[feature] ?? 0;

  if (limit >= 999) {
    return { allowed: true, remaining: 999, limit, tier };
  }

  // Check current usage via RPC
  const { data: usage } = await supabase.rpc("check_ai_usage", {
    p_user_id: user.id,
    p_feature: feature,
    p_limit: limit,
  });

  const allowed = Boolean(usage);

  // Get current count for remaining calculation
  const { count } = await supabase
    .from("nexgigs_ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("feature", feature)
    .gte(
      "used_at",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    );

  const remaining = Math.max(0, limit - (count ?? 0));

  return { allowed, remaining, limit, tier };
}

export async function recordAIUsage(feature: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.rpc("record_ai_usage", {
    p_user_id: user.id,
    p_feature: feature,
  });
}
