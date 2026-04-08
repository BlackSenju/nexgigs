"use server";

import { createClient } from "@/lib/supabase/server";

export async function getNotifications(limit = 20) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("nexgigs_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function markNotificationRead(notificationId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("nexgigs_notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);
}

export async function markAllNotificationsRead() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("nexgigs_notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
}

export async function getUnreadCount() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("nexgigs_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return count ?? 0;
}

/** Helper to send a notification (called from other server actions). */
export async function sendNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  const supabase = createClient();
  await supabase.from("nexgigs_notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
    read: false,
  });
}
