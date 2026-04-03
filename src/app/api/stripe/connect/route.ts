import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createConnectAccount,
  createOnboardingLink,
  checkAccountStatus,
} from "@/lib/stripe";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/stripe/connect
 * Start Stripe Connect onboarding for a gigger.
 * If they already have an account, generate a new onboarding link.
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("first_name, last_initial, stripe_connect_account_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  try {
    // If user already has a Connect account, check status or generate new link
    if (profile.stripe_connect_account_id) {
      const status = await checkAccountStatus(
        profile.stripe_connect_account_id
      );

      if (status.ready) {
        return NextResponse.json({
          status: "active",
          message: "Your Stripe account is ready to receive payments.",
        });
      }

      // Account exists but onboarding incomplete — generate new link
      const url = await createOnboardingLink(
        profile.stripe_connect_account_id
      );
      return NextResponse.json({ onboardingUrl: url });
    }

    // Create new Connect account
    const { accountId, onboardingUrl } = await createConnectAccount(
      user.id,
      user.email!,
      profile.first_name,
      profile.last_initial
    );

    // Save account ID to profile
    await supabase
      .from("nexgigs_profiles")
      .update({ stripe_connect_account_id: accountId })
      .eq("id", user.id);

    await logAuditEvent(user.id, "payment.authorized", "stripe_connect", accountId, {
      action: "account_created",
    });

    return NextResponse.json({ onboardingUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to set up payments: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/connect
 * Check the current user's Connect account status.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("stripe_connect_account_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_connect_account_id) {
    return NextResponse.json({ status: "not_connected" });
  }

  try {
    const status = await checkAccountStatus(
      profile.stripe_connect_account_id
    );
    return NextResponse.json({
      status: status.ready ? "active" : "incomplete",
      detailsSubmitted: status.detailsSubmitted,
      chargesEnabled: status.chargesEnabled,
    });
  } catch {
    return NextResponse.json({ status: "error" });
  }
}
