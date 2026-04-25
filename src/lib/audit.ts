"use server";

import { createClient } from "@/lib/supabase/server";

type AuditAction =
  | "auth.signup"
  | "auth.login"
  | "auth.logout"
  | "auth.mfa_enabled"
  | "auth.mfa_disabled"
  | "auth.password_changed"
  | "auth.failed_login"
  | "profile.updated"
  | "profile.verified"
  | "profile.background_checked"
  | "job.created"
  | "job.updated"
  | "job.deleted"
  | "job.applied"
  | "job.hired"
  | "job.completed"
  | "job.cancelled"
  | "payment.authorized"
  | "payment.captured"
  | "payment.released"
  | "payment.refunded"
  | "payment.disputed"
  | "rating.submitted"
  | "ghost.reported"
  | "ghost.wall_added"
  | "message.sent"
  | "guild.created"
  | "guild.joined"
  | "shop.item_listed"
  | "shop.item_deleted"
  | "shop.order_placed"
  | "shop.reward_redeemed"
  | "subscription.upgraded"
  | "subscription.cancelled"
  | "storefront.draft_created"
  | "storefront.published"
  | "storefront.unpublished"
  | "admin.action";

export async function logAuditEvent(
  userId: string | null,
  action: AuditAction,
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("nexgigs_audit_log").insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: metadata ?? {},
    });
  } catch (error) {
    console.error("[Audit] Failed to log event:", error);
  }
}
