"use server";

import { createClient } from "@/lib/supabase/server";

async function hasTalentPoolAccess(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("nexgigs_subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  return ["business_growth", "enterprise"].includes(data?.tier ?? "");
}

export async function saveToTalentPool(
  giggerId: string,
  note?: string,
  tags?: string[]
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const hasAccess = await hasTalentPoolAccess();
  if (!hasAccess)
    return {
      error: "Talent Pool requires Business Growth or Enterprise subscription",
    };

  const { error } = await supabase.from("nexgigs_talent_pool").upsert(
    {
      business_user_id: user.id,
      gigger_id: giggerId,
      note: note ?? null,
      tags: tags ?? [],
    },
    { onConflict: "business_user_id,gigger_id" }
  );

  return error ? { error: error.message } : { success: true };
}

export async function removeFromTalentPool(giggerId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("nexgigs_talent_pool")
    .delete()
    .eq("business_user_id", user.id)
    .eq("gigger_id", giggerId);

  return error ? { error: error.message } : { success: true };
}

export async function getTalentPool() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("nexgigs_talent_pool")
    .select(
      `
      *,
      gigger:nexgigs_profiles!gigger_id(id, first_name, last_initial, avatar_url, city, state, bio)
    `
    )
    .eq("business_user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function isInTalentPool(giggerId: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("nexgigs_talent_pool")
    .select("id")
    .eq("business_user_id", user.id)
    .eq("gigger_id", giggerId)
    .maybeSingle();

  return !!data;
}
