import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPersonaInquiry } from "@/lib/persona";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/verify/persona
 * Start Persona ID verification for the current user.
 */
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("first_name, last_initial, identity_verified, persona_inquiry_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.identity_verified) {
    return NextResponse.json({ status: "already_verified" });
  }

  try {
    const { inquiryId, sessionUrl } = await createPersonaInquiry({
      userId: user.id,
      email: user.email!,
      firstName: profile.first_name,
      lastName: profile.last_initial,
    });

    // Save inquiry ID
    await supabase
      .from("nexgigs_profiles")
      .update({ persona_inquiry_id: inquiryId })
      .eq("id", user.id);

    await logAuditEvent(user.id, "profile.updated", "persona", inquiryId, {
      action: "inquiry_created",
    });

    return NextResponse.json({ sessionUrl, inquiryId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
