import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyDiscord } from "@/lib/discord";
import { logAuditEvent } from "@/lib/audit";
import { verifyPersonaWebhook } from "@/lib/persona";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/persona
 * Handles Persona verification webhooks.
 *
 * Security: requires a valid `Persona-Signature` header (HMAC-SHA256 of
 * `<timestamp>.<raw-body>` keyed by PERSONA_WEBHOOK_SECRET). Without this,
 * anyone could POST a forged `inquiry.completed` event and instantly grant
 * themselves identity_verified status.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("persona-signature");

  const valid = await verifyPersonaWebhook(body, signature);
  if (!valid) {
    await notifyDiscord("security_alert", {
      message: "Persona webhook signature verification failed",
      ip: request.headers.get("x-forwarded-for") ?? "unknown",
    }).catch(() => {});
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.data?.attributes?.name;
  const inquiryId = event.data?.attributes?.payload?.data?.id;
  const status = event.data?.attributes?.payload?.data?.attributes?.status;
  const referenceId = event.data?.attributes?.payload?.data?.attributes?.referenceId;

  if (!inquiryId) {
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();

  try {
    if (eventType === "inquiry.completed" || status === "completed") {
      // Find user by inquiry ID or reference ID
      let userId = referenceId;

      if (!userId) {
        const { data: profile } = await supabase
          .from("nexgigs_profiles")
          .select("id")
          .eq("persona_inquiry_id", inquiryId)
          .single();
        userId = profile?.id;
      }

      if (userId) {
        await supabase
          .from("nexgigs_profiles")
          .update({
            identity_verified: true,
            verification_tier: "verified",
            persona_verified_at: new Date().toISOString(),
          })
          .eq("id", userId);

        await notifyDiscord("identity_verified", {
          name: userId,
          accountType: "ID Verified via Persona",
          city: "",
          state: "",
        });

        await logAuditEvent(userId, "profile.verified", "persona", inquiryId);
      }
    }

    if (eventType === "inquiry.failed" || status === "failed") {
      const { data: profile } = await supabase
        .from("nexgigs_profiles")
        .select("id")
        .eq("persona_inquiry_id", inquiryId)
        .single();

      if (profile?.id) {
        await notifyDiscord("security_alert", {
          message: `Persona ID verification FAILED for user ${profile.id}`,
          user: profile.id,
        });
      }
    }
  } catch (error) {
    console.error("[webhooks/persona] handler error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
