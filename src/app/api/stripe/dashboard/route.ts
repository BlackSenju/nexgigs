import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDashboardLink } from "@/lib/stripe";

/**
 * GET /api/stripe/dashboard
 * Generate a Stripe Express dashboard login link for the current user.
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
    return NextResponse.json(
      { error: "No Stripe account connected" },
      { status: 400 }
    );
  }

  try {
    const url = await createDashboardLink(profile.stripe_connect_account_id);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate dashboard link" },
      { status: 500 }
    );
  }
}
