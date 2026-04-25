"use server";

import { createClient } from "@/lib/supabase/server";
import { moderateShopItem } from "@/lib/moderation";
import { logAuditEvent } from "@/lib/audit";
import { notifyDiscord } from "@/lib/discord";
import { sanitizeOrSearch, clampLimit } from "@/lib/postgrest";

export type ListingType = "product" | "digital" | "service" | "experience" | "subscription";

export async function createShopListing(input: {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  listingType: ListingType;
  price: number;
  priceBasic?: number;
  priceStandard?: number;
  pricePremium?: number;
  basicDescription?: string;
  standardDescription?: string;
  premiumDescription?: string;
  // Physical product fields
  condition?: string;
  shippingType?: string;
  shippingPrice?: number;
  meetupEnabled?: boolean;
  meetupLocation?: string;
  // Service fields
  sessionDuration?: number;
  sessionFormat?: string;
  groupMaxSize?: number;
  recurringInterval?: string;
  subjects?: string[];
  certifications?: string[];
  equipmentProvided?: boolean;
  locationType?: string;
  availability?: Record<string, string[]>;
  // Policy
  refundPolicy?: string;
  customRefundText?: string;
  // Images
  imageUrls?: string[];
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // SECURITY: Check tier for Pro+ features (bundles, package tiers)
  const { data: sub } = await supabase
    .from("nexgigs_subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();
  const tier = sub?.tier ?? "free";
  const isPro = ["pro", "elite", "business_starter", "business_growth", "enterprise"].includes(tier);

  // Strip Pro-only fields from free user input
  const sanitizedInput = isPro ? input : {
    ...input,
    priceBasic: undefined,
    priceStandard: undefined,
    pricePremium: undefined,
    basicDescription: undefined,
    standardDescription: undefined,
    premiumDescription: undefined,
  };

  // Content moderation
  const modResult = moderateShopItem({
    title: input.title,
    description: input.description,
    price: input.price,
  });

  if (modResult.blocked) {
    return { error: modResult.blockReason ?? "This listing contains prohibited content." };
  }

  const { data: item, error } = await supabase
    .from("nexgigs_shop_items")
    .insert({
      seller_id: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      subcategory: input.subcategory,
      listing_type: input.listingType,
      item_type: input.listingType === "product" ? "physical" : "digital",
      price: input.price,
      price_basic: sanitizedInput.priceBasic,
      price_standard: sanitizedInput.priceStandard,
      price_premium: sanitizedInput.pricePremium,
      basic_description: sanitizedInput.basicDescription,
      standard_description: sanitizedInput.standardDescription,
      premium_description: sanitizedInput.premiumDescription,
      condition: input.condition ?? "new",
      shipping_type: input.shippingType ?? "none",
      shipping_price: input.shippingPrice ?? 0,
      meetup_enabled: input.meetupEnabled ?? false,
      meetup_location: input.meetupLocation,
      session_duration_minutes: input.sessionDuration,
      session_format: input.sessionFormat,
      group_max_size: input.groupMaxSize,
      recurring_interval: input.recurringInterval,
      subjects: input.subjects,
      certifications: input.certifications,
      equipment_provided: input.equipmentProvided ?? false,
      location_type: input.locationType ?? "flexible",
      availability: input.availability ?? {},
      refund_policy: input.refundPolicy ?? "no_refunds",
      custom_refund_text: input.customRefundText,
      image_url: input.imageUrls?.[0] ?? null,
      image_urls: input.imageUrls ?? [],
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Notifications
  Promise.all([
    notifyDiscord("shop_item_listed", {
      name: input.title,
      accountType: `${input.listingType} - $${input.price}`,
      city: "",
      state: "",
    }),
    logAuditEvent(user.id, "shop.item_listed", "shop_item", item.id, {
      listingType: input.listingType,
      price: input.price,
    }),
  ]).catch(() => {});

  return { item, warnings: modResult.warnings };
}

/**
 * Get all shop listings with optional filters.
 */
export async function getShopListings(filters?: {
  category?: string;
  listingType?: ListingType;
  search?: string;
  sellerId?: string;
  limit?: number;
}) {
  const supabase = createClient();
  let query = supabase
    .from("nexgigs_shop_items")
    .select(`
      *,
      seller:nexgigs_profiles!seller_id(id, first_name, last_initial, avatar_url, city, state)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.listingType) query = query.eq("listing_type", filters.listingType);
  if (filters?.sellerId) query = query.eq("seller_id", filters.sellerId);
  if (filters?.search) {
    // Same sanitization as getJobs — strip PostgREST `or()` control chars.
    const safe = sanitizeOrSearch(filters.search);
    if (safe.length > 0) {
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
    }
  }
  query = query.limit(clampLimit(filters?.limit));

  const { data } = await query;
  return data ?? [];
}

/**
 * Delete (deactivate) a shop listing. Only the seller can do this.
 */
export async function deleteShopListing(itemId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify ownership
  const { data: item } = await supabase
    .from("nexgigs_shop_items")
    .select("seller_id")
    .eq("id", itemId)
    .single();

  if (!item) return { error: "Listing not found" };
  if (item.seller_id !== user.id) return { error: "You can only delete your own listings" };

  // Soft delete — set is_active to false
  const { error } = await supabase
    .from("nexgigs_shop_items")
    .update({ is_active: false })
    .eq("id", itemId);

  if (error) return { error: error.message };

  await logAuditEvent(user.id, "shop.item_deleted", "shop_item", itemId, {});

  return { success: true };
}
