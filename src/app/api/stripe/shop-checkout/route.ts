import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, createCustomer } from "@/lib/stripe";

/**
 * POST /api/stripe/shop-checkout
 * Create a Stripe Checkout Session for purchasing a shop item.
 * Supports single price, package tiers, and Connect payouts to sellers.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { itemId, tier } = body; // tier: null | "basic" | "standard" | "premium"

  if (!itemId) {
    return NextResponse.json({ error: "Item ID required" }, { status: 400 });
  }

  // Fetch the shop item and seller
  const { data: item } = await supabase
    .from("nexgigs_shop_items")
    .select(`
      id, title, price, price_basic, price_standard, price_premium,
      listing_type, seller_id, is_active,
      seller:nexgigs_profiles!seller_id(stripe_connect_account_id)
    `)
    .eq("id", itemId)
    .single();

  if (!item || !item.is_active) {
    return NextResponse.json({ error: "Item not found or no longer available" }, { status: 404 });
  }

  // Can't buy your own item
  if (item.seller_id === user.id) {
    return NextResponse.json({ error: "You can't purchase your own listing" }, { status: 400 });
  }

  // Determine price based on tier
  let price = Number(item.price);
  let tierLabel = "";
  if (tier === "basic" && item.price_basic) {
    price = Number(item.price_basic);
    tierLabel = " (Basic)";
  } else if (tier === "standard" && item.price_standard) {
    price = Number(item.price_standard);
    tierLabel = " (Standard)";
  } else if (tier === "premium" && item.price_premium) {
    price = Number(item.price_premium);
    tierLabel = " (Premium)";
  }

  if (price < 1) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  // Get or create buyer's Stripe customer
  const { data: buyerProfile } = await supabase
    .from("nexgigs_profiles")
    .select("stripe_customer_id, first_name, last_initial")
    .eq("id", user.id)
    .single();

  let customerId = buyerProfile?.stripe_customer_id;

  if (!customerId) {
    try {
      customerId = await createCustomer(
        user.email!,
        user.id,
        `${buyerProfile?.first_name ?? "User"} ${buyerProfile?.last_initial ?? ""}`.trim()
      );
      await supabase
        .from("nexgigs_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    } catch {
      return NextResponse.json({ error: "Failed to set up payment" }, { status: 500 });
    }
  }

  // 10% platform commission
  const amountCents = Math.round(price * 100);
  const platformFeeCents = Math.round(amountCents * 0.10);

  // Check if seller has Stripe Connect (for direct payouts)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerData = item.seller as any;
  const sellerConnectId = sellerData?.stripe_connect_account_id as string | null;

  try {
    // Build checkout session config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionConfig: Record<string, any> = {
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${item.title}${tierLabel}`,
              description: `Shop purchase on NexGigs`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `https://nexgigs.com/shop/${itemId}?purchased=true`,
      cancel_url: `https://nexgigs.com/shop/${itemId}`,
      metadata: {
        nexgigs_item_id: itemId,
        nexgigs_buyer_id: user.id,
        nexgigs_seller_id: item.seller_id,
        nexgigs_tier: tier || "default",
        nexgigs_type: "shop_purchase",
      },
    };

    // If seller has Connect, send funds directly to them minus platform fee
    if (sellerConnectId) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: sellerConnectId,
        },
        metadata: {
          nexgigs_item_id: itemId,
          nexgigs_buyer_id: user.id,
          nexgigs_seller_id: item.seller_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
