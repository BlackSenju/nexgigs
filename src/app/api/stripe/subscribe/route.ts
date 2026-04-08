import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/subscription-config";
import { createCustomer } from "@/lib/stripe";

/**
 * POST /api/stripe/subscribe
 * Create a Stripe Checkout Session for a subscription tier.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const tier = body.tier as SubscriptionTier;

  if (!tier || !SUBSCRIPTION_TIERS[tier]) {
    return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
  }

  const tierConfig = SUBSCRIPTION_TIERS[tier];

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("stripe_customer_id, first_name, last_initial")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    try {
      customerId = await createCustomer(
        user.email!,
        user.id,
        `${profile?.first_name ?? "User"} ${profile?.last_initial ?? ""}`.trim()
      );
      await supabase
        .from("nexgigs_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    } catch {
      return NextResponse.json({ error: "Failed to set up billing" }, { status: 500 });
    }
  }

  try {
    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: tierConfig.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `https://nexgigs.com/subscription?success=true&tier=${tier}`,
      cancel_url: `https://nexgigs.com/subscription?canceled=true`,
      metadata: {
        nexgigs_user_id: user.id,
        nexgigs_tier: tier,
      },
      subscription_data: {
        metadata: {
          nexgigs_user_id: user.id,
          nexgigs_tier: tier,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
