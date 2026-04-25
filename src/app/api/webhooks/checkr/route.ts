import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyDiscord } from "@/lib/discord";
import { logAuditEvent } from "@/lib/audit";
import { verifyCheckrWebhook } from "@/lib/checkr";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/checkr
 * Handles Checkr background check webhooks.
 *
 * Security: requires a valid `X-Checkr-Signature` header (HMAC-SHA256 of the
 * raw body, keyed by `CHECKR_API_KEY` per Checkr's docs — Checkr uses the
 * same API key for HMAC signing rather than a separate webhook secret).
 * Without this, anyone could grant themselves "Verified Pro" status by
 * POSTing a forged event.
 */
export async function POST(request: NextRequest) {
  // Read raw body BEFORE parsing — signature is computed over the raw bytes.
  const rawBody = await request.text();
  const signature = request.headers.get("x-checkr-signature");

  const valid = await verifyCheckrWebhook(rawBody, signature);
  if (!valid) {
    await notifyDiscord("security_alert", {
      message: "Checkr webhook signature verification failed",
      ip: request.headers.get("x-forwarded-for") ?? "unknown",
    }).catch(() => {});
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = body.type as string | undefined;
  const dataObject = (body.data as { object?: Record<string, unknown> })?.object ?? {};
  const reportId = dataObject.id as string | undefined;
  const candidateId = dataObject.candidate_id as string | undefined;
  const status = dataObject.status as string | undefined;
  const result = dataObject.result as string | undefined;

  const supabase = createAdminClient();

  try {
    // Report completed
    if (eventType === "report.completed" && candidateId) {
      const { data: profile } = await supabase
        .from("nexgigs_profiles")
        .select("id, first_name, last_initial")
        .eq("checkr_candidate_id", candidateId)
        .single();

      if (profile) {
        const isClear = result === "clear";

        await supabase
          .from("nexgigs_profiles")
          .update({
            background_checked: isClear,
            checkr_report_id: reportId,
            checkr_status: result ?? status ?? "completed",
            checkr_completed_at: new Date().toISOString(),
            ...(isClear ? { verification_tier: "verified_pro" } : {}),
          })
          .eq("id", profile.id);

        await notifyDiscord(isClear ? "background_checked" : "security_alert", {
          name: `${profile.first_name} ${profile.last_initial}.`,
          accountType: isClear
            ? "Background Check CLEAR — Verified Pro"
            : `Background Check: ${result ?? status}`,
          city: "",
          state: "",
        });

        await logAuditEvent(
          profile.id,
          "profile.background_checked",
          "checkr",
          reportId,
          { result, status }
        );
      }
    }

    // Invitation completed (candidate finished consent flow)
    if (eventType === "invitation.completed" && candidateId) {
      await supabase
        .from("nexgigs_profiles")
        .update({ checkr_status: "processing" })
        .eq("checkr_candidate_id", candidateId);
    }
  } catch (error) {
    // Log internally but never leak the underlying error message to the caller.
    console.error("[webhooks/checkr] handler error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
