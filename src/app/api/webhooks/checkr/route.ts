import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyDiscord } from "@/lib/discord";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/webhooks/checkr
 * Handles Checkr background check webhooks.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const eventType = body.type;
  const reportId = body.data?.object?.id;
  const candidateId = body.data?.object?.candidate_id;
  const status = body.data?.object?.status;
  const result = body.data?.object?.result;

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
    const message = error instanceof Error ? error.message : "Webhook failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
