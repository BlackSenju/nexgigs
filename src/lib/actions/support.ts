"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotification } from "@/lib/actions/notifications";

const TIER_PRIORITY: Record<string, string> = {
  enterprise: "vip",
  business_growth: "vip",
  business_starter: "high",
  elite: "urgent",
  pro: "high",
  free: "normal",
};

const TIER_RESPONSE_TIME: Record<string, string> = {
  vip: "6 hours",
  urgent: "12 hours",
  high: "24 hours",
  normal: "48 hours",
};

export async function createTicket(input: {
  subject: string;
  description: string;
  category: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Validate input
  if (!input.subject.trim() || !input.description.trim() || !input.category.trim()) {
    return { error: "All fields are required" };
  }

  // Get user's tier for priority
  const { data: sub } = await supabase
    .from("nexgigs_subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  const tier = sub?.tier ?? "free";
  const priority = TIER_PRIORITY[tier] ?? "normal";

  const { data: ticket, error } = await supabase
    .from("nexgigs_support_tickets")
    .insert({
      user_id: user.id,
      subject: input.subject.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      priority,
      status: "open",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  return { ticket, responseTime: TIER_RESPONSE_TIME[priority] ?? "48 hours" };
}

export async function getMyTickets() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("nexgigs_support_tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getMyPriority() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { priority: "normal", responseTime: "48 hours", tier: "free" };

  const { data: sub } = await supabase
    .from("nexgigs_subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  const tier = sub?.tier ?? "free";
  const priority = TIER_PRIORITY[tier] ?? "normal";
  const responseTime = TIER_RESPONSE_TIME[priority] ?? "48 hours";

  return { priority, responseTime, tier };
}

// Check if current user is admin (uses maybeSingle for safety)
async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("nexgigs_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return data?.is_admin === true;
}

export async function getAllTickets() {
  // SECURITY: Admin only
  const admin = await isCurrentUserAdmin();
  if (!admin) return [];

  // Use admin client to bypass RLS so we can see all tickets
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("nexgigs_support_tickets")
    .select(
      "*, user:nexgigs_profiles!user_id(first_name, last_initial, city, state)"
    )
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function respondToTicket(ticketId: string, response: string) {
  // SECURITY: Admin only
  const admin = await isCurrentUserAdmin();
  if (!admin) return { error: "Not authorized" };

  const supabase = createAdminClient();

  if (!ticketId || !response.trim()) {
    return { error: "Ticket ID and response are required" };
  }

  const { data: ticket, error } = await supabase
    .from("nexgigs_support_tickets")
    .update({
      admin_response: response.trim(),
      status: "resolved",
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
    .select("user_id, subject")
    .single();

  if (error) return { error: error.message };

  if (ticket) {
    sendNotification({
      userId: ticket.user_id,
      type: "system",
      title: "Support ticket resolved",
      body: `Your ticket "${ticket.subject}" has been responded to.`,
      link: "/support",
    }).catch(() => {});
  }

  return { success: true };
}
