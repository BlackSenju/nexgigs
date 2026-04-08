"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Request to exchange contact info with another user.
 * Both parties must consent before any info is shared.
 */
export async function requestContactExchange(input: {
  targetId: string;
  jobId?: string;
  orderId?: string;
  sharePhone: boolean;
  shareEmail: boolean;
  shareSocial: boolean;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (user.id === input.targetId) return { error: "Cannot exchange with yourself" };

  // Get requester contact info
  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("contact_phone, contact_email_public, contact_social, share_phone_enabled, share_email_enabled, share_social_enabled")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  // Only share what the requester has enabled AND what they're requesting to share
  const { data: exchange, error } = await supabase
    .from("nexgigs_contact_exchanges")
    .insert({
      requester_id: user.id,
      target_id: input.targetId,
      job_id: input.jobId || null,
      order_id: input.orderId || null,
      share_phone: input.sharePhone && Boolean(profile.share_phone_enabled),
      share_email: input.shareEmail && Boolean(profile.share_email_enabled),
      share_social: input.shareSocial && Boolean(profile.share_social_enabled),
      requester_phone: input.sharePhone ? (profile.contact_phone as string) : null,
      requester_email: input.shareEmail ? (profile.contact_email_public as string) : null,
      requester_social: input.shareSocial ? (profile.contact_social as string) : null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Contact exchange already requested" };
    return { error: error.message };
  }

  return { exchange };
}

/**
 * Approve a contact exchange request — share your info back.
 */
export async function approveContactExchange(exchangeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get the exchange
  const { data: exchange } = await supabase
    .from("nexgigs_contact_exchanges")
    .select("*")
    .eq("id", exchangeId)
    .eq("target_id", user.id)
    .eq("status", "pending")
    .single();

  if (!exchange) return { error: "Exchange not found or not authorized" };

  // Get target (current user) contact info
  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("contact_phone, contact_email_public, contact_social")
    .eq("id", user.id)
    .single();

  // Update with target's info and mark approved
  const { error } = await supabase
    .from("nexgigs_contact_exchanges")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      target_phone: exchange.share_phone ? (profile?.contact_phone as string) : null,
      target_email: exchange.share_email ? (profile?.contact_email_public as string) : null,
      target_social: exchange.share_social ? (profile?.contact_social as string) : null,
    })
    .eq("id", exchangeId);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Decline a contact exchange request.
 */
export async function declineContactExchange(exchangeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("nexgigs_contact_exchanges")
    .update({ status: "declined" })
    .eq("id", exchangeId)
    .eq("target_id", user.id);

  return error ? { error: error.message } : { success: true };
}

/**
 * Get all active contact exchanges for the current user.
 */
export async function getContactExchanges() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("nexgigs_contact_exchanges")
    .select(`
      *,
      requester:nexgigs_profiles!requester_id(first_name, last_initial, avatar_url),
      target:nexgigs_profiles!target_id(first_name, last_initial, avatar_url)
    `)
    .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
    .neq("status", "expired")
    .order("created_at", { ascending: false });

  return data ?? [];
}
