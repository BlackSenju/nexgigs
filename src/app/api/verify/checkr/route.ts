import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBackgroundCheck } from "@/lib/checkr";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/verify/checkr
 * Start Checkr background check for the current user.
 * Requires identity verification first.
 */
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("first_name, last_initial, identity_verified, background_checked, checkr_candidate_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!profile.identity_verified) {
    return NextResponse.json(
      { error: "You must complete ID verification before starting a background check." },
      { status: 400 }
    );
  }

  if (profile.background_checked) {
    return NextResponse.json({ status: "already_checked" });
  }

  try {
    const { candidateId, invitationUrl } = await createBackgroundCheck({
      userId: user.id,
      email: user.email!,
      firstName: profile.first_name,
      lastName: profile.last_initial,
    });

    await supabase
      .from("nexgigs_profiles")
      .update({
        checkr_candidate_id: candidateId,
        checkr_status: "pending",
      })
      .eq("id", user.id);

    await logAuditEvent(user.id, "profile.background_checked", "checkr", candidateId, {
      action: "check_started",
    });

    return NextResponse.json({ invitationUrl, candidateId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Background check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
