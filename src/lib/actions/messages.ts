"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { moderateMessage } from "@/lib/moderation";

/**
 * Get all conversations for the current user.
 */
export async function getConversations() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { conversations: [] };

  const { data } = await supabase
    .from("nexgigs_conversations")
    .select(`
      *,
      participant_1:nexgigs_profiles!participant_1_id(id, first_name, last_initial),
      participant_2:nexgigs_profiles!participant_2_id(id, first_name, last_initial),
      job:nexgigs_jobs!job_id(title)
    `)
    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  return {
    conversations: (data ?? []).map((c) => {
      const isP1 = c.participant_1_id === user.id;
      const other = isP1 ? c.participant_2 : c.participant_1;
      const unread = isP1 ? c.participant_1_unread : c.participant_2_unread;
      return {
        id: c.id,
        otherUser: other,
        jobTitle: String((c.job as Record<string, unknown>)?.title ?? "") || null,
        lastMessage: c.last_message_preview,
        lastMessageAt: c.last_message_at,
        unread,
      };
    }),
    userId: user.id,
  };
}

/**
 * Get messages for a specific conversation.
 */
export async function getMessages(conversationId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { messages: [], userId: "" };

  // Verify user is a participant
  const { data: convo } = await supabase
    .from("nexgigs_conversations")
    .select("participant_1_id, participant_2_id")
    .eq("id", conversationId)
    .single();

  if (
    !convo ||
    (convo.participant_1_id !== user.id && convo.participant_2_id !== user.id)
  ) {
    return { messages: [], userId: user.id };
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from("nexgigs_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  // Mark messages as read
  const isP1 = convo.participant_1_id === user.id;
  await supabase
    .from("nexgigs_conversations")
    .update(isP1 ? { participant_1_unread: 0 } : { participant_2_unread: 0 })
    .eq("id", conversationId);

  return { messages: messages ?? [], userId: user.id };
}

/**
 * Send a message in a conversation.
 */
export async function sendMessage(conversationId: string, content: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };
  if (!content.trim()) return { error: "Message cannot be empty" };

  // Content moderation — check for off-platform attempts
  const modResult = moderateMessage(content);
  const warnings = modResult.warnings;

  // Verify participant
  const { data: convo } = await supabase
    .from("nexgigs_conversations")
    .select("participant_1_id, participant_2_id")
    .eq("id", conversationId)
    .single();

  if (
    !convo ||
    (convo.participant_1_id !== user.id && convo.participant_2_id !== user.id)
  ) {
    return { error: "Not authorized" };
  }

  // Insert message
  const { data: message, error } = await supabase
    .from("nexgigs_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Return message with moderation warnings (message still sends, but user sees warning)
  const messageWithWarnings = { ...message, warnings };

  // Update conversation preview and unread count
  const isP1 = convo.participant_1_id === user.id;
  const preview = content.trim().slice(0, 100);

  await supabase
    .from("nexgigs_conversations")
    .update({
      last_message_preview: preview,
      last_message_at: new Date().toISOString(),
      ...(isP1
        ? { participant_2_unread: 1 }
        : { participant_1_unread: 1 }),
    })
    .eq("id", conversationId);

  return { message: messageWithWarnings };
}

/**
 * Start a new conversation (or return existing one).
 */
export async function startConversation(otherUserId: string, jobId?: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };
  if (user.id === otherUserId) return { error: "Cannot message yourself" };

  // Check for existing conversation between these users
  const { data: existing } = await supabase
    .from("nexgigs_conversations")
    .select("id")
    .or(
      `and(participant_1_id.eq.${user.id},participant_2_id.eq.${otherUserId}),and(participant_1_id.eq.${otherUserId},participant_2_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existing) return { conversationId: existing.id };

  // Create new conversation
  const { data: convo, error } = await supabase
    .from("nexgigs_conversations")
    .insert({
      participant_1_id: user.id,
      participant_2_id: otherUserId,
      job_id: jobId ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAuditEvent(user.id, "message.sent", "conversation", convo.id);

  return { conversationId: convo.id };
}
