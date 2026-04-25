"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { notifyDiscord } from "@/lib/discord";
import {
  validateSlug,
  normalizeSlug,
  suggestAvailableSlug,
} from "@/lib/storefront-slug";

/**
 * Storefront record shape (mirrors nexgigs_storefronts schema).
 *
 * The Supabase client is untyped in this repo; this interface is the
 * canonical type seen by callers. Keep it in sync with the SQL migration
 * at supabase/migrations/20260424_storefronts_phase_1.sql.
 */
export interface Storefront {
  id: string;
  user_id: string;
  slug: string;
  industry: StorefrontIndustry;
  status: StorefrontStatus;
  hero_image_url: string | null;
  logo_kind: "icon" | "image";
  logo_value: string | null;
  brand_color: string;
  accent_color: string | null;
  tagline: string | null;
  about_html: string | null;
  how_it_works: HowItWorksStep[] | null;
  faqs: Faq[] | null;
  social_links: SocialLinks | null;
  service_areas: string[] | null;
  sections: StorefrontSection[];
  photo_gallery: string[] | null;
  ai_drafted_at: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export type StorefrontStatus = "draft" | "published" | "suspended";

export type StorefrontIndustry =
  | "service"
  | "clothing"
  | "food"
  | "coaching"
  | "maker"
  | "events"
  | "wellness"
  | "tech"
  | "other";

export type StorefrontSection =
  | "hero"
  | "packages"
  | "about"
  | "how_it_works"
  | "photos"
  | "faqs"
  | "contact";

export interface HowItWorksStep {
  step: number;
  title: string;
  body: string;
  icon?: string | null;
}

export interface Faq {
  q: string;
  a: string;
}

export interface SocialLinks {
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  x?: string | null;
  youtube?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
}

const COLOR_RE = /^#[0-9a-f]{6}$/i;
const HTTP_RE = /^https?:\/\//i;

/**
 * Get the calling user's storefront, or null if they don't have one yet.
 * RLS allows users to read their own draft via owner policy.
 */
export async function getMyStorefront(): Promise<{
  storefront: Storefront | null;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { storefront: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("nexgigs_storefronts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { storefront: null, error: error.message };
  return { storefront: (data as Storefront | null) ?? null };
}

/**
 * Public read of a storefront by slug. RLS only returns rows where
 * status='published', so callers don't need to filter.
 */
export async function getStorefrontBySlug(slug: string): Promise<{
  storefront: Storefront | null;
  error?: string;
}> {
  const validation = validateSlug(slug);
  if (validation) return { storefront: null, error: validation.message };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("nexgigs_storefronts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return { storefront: null, error: error.message };
  return { storefront: (data as Storefront | null) ?? null };
}

export interface StorefrontPublicView {
  storefront: Storefront;
  businessName: string;
  packages: Array<{
    id: string;
    title: string;
    description: string | null;
    price: number;
    listing_type: string | null;
    recurring_interval: string | null;
  }>;
}

/**
 * Bundles everything the public `/store/<slug>` page needs in one round-trip:
 * the storefront row, the owner's `business_name` (or fallback display name),
 * and their active shop listings to render in the Packages section.
 *
 * All reads go through the user-scoped client and rely on existing RLS
 * (storefronts: published-public; profiles + shop_items: public read). No
 * service-role bypass needed — this lets anonymous visitors render the page.
 */
export async function getStorefrontPublicView(slug: string): Promise<{
  view: StorefrontPublicView | null;
  error?: string;
}> {
  const { storefront, error } = await getStorefrontBySlug(slug);
  if (error) return { view: null, error };
  if (!storefront) return { view: null };

  const supabase = createClient();

  const [{ data: profile }, { data: items }] = await Promise.all([
    supabase
      .from("nexgigs_profiles")
      .select("first_name, last_initial, business_name")
      .eq("id", storefront.user_id)
      .maybeSingle(),
    supabase
      .from("nexgigs_shop_items")
      .select("id, title, description, price, listing_type, recurring_interval")
      .eq("seller_id", storefront.user_id)
      .eq("is_active", true)
      .order("price", { ascending: true })
      .limit(12),
  ]);

  const businessName =
    profile?.business_name ||
    `${profile?.first_name ?? ""} ${profile?.last_initial ?? ""}`.trim() ||
    "Local Business";

  return {
    view: {
      storefront,
      businessName,
      packages: (items ?? []).map((row) => ({
        id: String(row.id),
        title: String(row.title),
        description: row.description as string | null,
        price: Number(row.price),
        listing_type: row.listing_type as string | null,
        recurring_interval: row.recurring_interval as string | null,
      })),
    },
  };
}

/**
 * Check if a slug is available. Reserved slugs and existing rows both count
 * as taken. Validation errors return `{ available: false, reason }`.
 */
export async function checkSlugAvailable(slug: string): Promise<{
  available: boolean;
  reason?: string;
}> {
  const validation = validateSlug(slug);
  if (validation) return { available: false, reason: validation.message };

  // Use admin client for the existence check — the user might not yet have a
  // storefront, and RLS would otherwise hide other users' draft rows from us.
  // We're only reading slug presence, not exfiltrating data.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("nexgigs_storefronts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return { available: false, reason: error.message };
  if (data) return { available: false, reason: "That URL is already taken" };
  return { available: true };
}

/**
 * Create a draft storefront for the calling user. Idempotent — if a row
 * already exists for this user, returns it. The slug is normalized from the
 * provided base (or the user's first name); if taken, we auto-suffix.
 */
export async function createStorefrontDraft(input: {
  baseSlug: string;
  industry?: StorefrontIndustry;
}): Promise<{ storefront?: Storefront; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const existing = await getMyStorefront();
  if (existing.storefront) return { storefront: existing.storefront };

  const admin = createAdminClient();
  const slug = await suggestAvailableSlug(input.baseSlug, async (cand) => {
    const { data } = await admin
      .from("nexgigs_storefronts")
      .select("id")
      .eq("slug", cand)
      .maybeSingle();
    return !!data;
  });
  if (!slug) {
    return { error: "Could not generate an available URL — please pick one manually" };
  }

  const { data, error } = await supabase
    .from("nexgigs_storefronts")
    .insert({
      user_id: user.id,
      slug,
      industry: input.industry ?? "other",
      status: "draft",
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  await logAuditEvent(user.id, "storefront.draft_created", "storefront", data.id, {
    slug,
  }).catch(() => null);

  return { storefront: data as Storefront };
}

/**
 * Patch a storefront. Validates branding + content fields, sanitizes URLs,
 * and only writes fields the caller actually included.
 */
export async function updateStorefront(input: {
  slug?: string;
  industry?: StorefrontIndustry;
  hero_image_url?: string | null;
  logo_kind?: "icon" | "image";
  logo_value?: string | null;
  brand_color?: string;
  accent_color?: string | null;
  tagline?: string | null;
  about_html?: string | null;
  how_it_works?: HowItWorksStep[] | null;
  faqs?: Faq[] | null;
  social_links?: SocialLinks | null;
  service_areas?: string[] | null;
  sections?: StorefrontSection[];
  photo_gallery?: string[] | null;
}): Promise<{ storefront?: Storefront; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const patch: Record<string, unknown> = {};

  if (input.slug !== undefined) {
    const validation = validateSlug(input.slug);
    if (validation) return { error: validation.message };
    const avail = await checkSlugAvailable(input.slug);
    // Allow keeping the same slug we already own — re-fetch our row to compare.
    if (!avail.available) {
      const me = await getMyStorefront();
      if (me.storefront?.slug !== input.slug) {
        return { error: avail.reason ?? "URL is taken" };
      }
    }
    patch.slug = input.slug;
  }

  if (input.industry !== undefined) patch.industry = input.industry;

  if (input.brand_color !== undefined) {
    if (!COLOR_RE.test(input.brand_color)) {
      return { error: "Brand color must be a #RRGGBB hex value" };
    }
    patch.brand_color = input.brand_color.toLowerCase();
  }
  if (input.accent_color !== undefined) {
    if (input.accent_color !== null && !COLOR_RE.test(input.accent_color)) {
      return { error: "Accent color must be a #RRGGBB hex value" };
    }
    patch.accent_color = input.accent_color?.toLowerCase() ?? null;
  }

  if (input.logo_kind !== undefined) patch.logo_kind = input.logo_kind;
  if (input.logo_value !== undefined) {
    // For icon mode `logo_value` is a lucide icon name (e.g. "Heart"); for
    // image mode it's a Supabase Storage URL. We don't allow javascript:
    // or other non-http(s) protocols in image mode.
    if (input.logo_kind === "image" || (input.logo_kind === undefined && input.logo_value)) {
      if (input.logo_value && !HTTP_RE.test(input.logo_value)) {
        return { error: "Logo URL must use http:// or https://" };
      }
    }
    patch.logo_value = input.logo_value;
  }

  if (input.hero_image_url !== undefined) {
    if (input.hero_image_url && !HTTP_RE.test(input.hero_image_url)) {
      return { error: "Hero image URL must use http:// or https://" };
    }
    patch.hero_image_url = input.hero_image_url;
  }

  if (input.tagline !== undefined) {
    patch.tagline = input.tagline?.slice(0, 200) ?? null;
  }
  if (input.about_html !== undefined) {
    // about_html is rendered with `dangerouslySetInnerHTML` after server-side
    // sanitization. We cap length and strip script tags as a baseline; the
    // public renderer does proper sanitize-html on output too.
    patch.about_html = input.about_html
      ? stripScripts(input.about_html).slice(0, 5000)
      : null;
  }

  if (input.how_it_works !== undefined) {
    patch.how_it_works = input.how_it_works
      ? input.how_it_works.slice(0, 6).map((s, i) => ({
          step: i + 1,
          title: String(s.title).slice(0, 80),
          body: String(s.body).slice(0, 280),
          icon: s.icon?.slice(0, 40) ?? null,
        }))
      : null;
  }

  if (input.faqs !== undefined) {
    patch.faqs = input.faqs
      ? input.faqs.slice(0, 8).map((f) => ({
          q: String(f.q).slice(0, 200),
          a: String(f.a).slice(0, 1200),
        }))
      : null;
  }

  if (input.social_links !== undefined) {
    patch.social_links = input.social_links === null
      ? null
      : sanitizeSocialLinks(input.social_links);
  }

  if (input.service_areas !== undefined) {
    patch.service_areas = input.service_areas
      ? input.service_areas
          .map((s) => String(s).slice(0, 60).trim())
          .filter(Boolean)
          .slice(0, 12)
      : null;
  }

  if (input.sections !== undefined) {
    const valid: StorefrontSection[] = [
      "hero", "packages", "about", "how_it_works", "photos", "faqs", "contact",
    ];
    patch.sections = input.sections.filter((s) => valid.includes(s));
  }

  if (input.photo_gallery !== undefined) {
    patch.photo_gallery = input.photo_gallery
      ? input.photo_gallery.filter((u) => HTTP_RE.test(u)).slice(0, 12)
      : null;
  }

  if (Object.keys(patch).length === 0) {
    return { error: "Nothing to update" };
  }

  const { data, error } = await supabase
    .from("nexgigs_storefronts")
    .update(patch)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { storefront: data as Storefront };
}

/**
 * Publish — flip status to 'published' and set published_at.
 *
 * Tier gate: free users can save drafts but cannot publish. Paid tiers
 * (any of pro/elite/premium/business_starter/business_growth/enterprise)
 * can publish. The tier check matches the existing pattern used by
 * createShopListing in src/lib/actions/shop.ts.
 */
export async function publishStorefront(): Promise<{
  storefront?: Storefront;
  error?: string;
  upgradeRequired?: boolean;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Existing tier-check pattern from shop.ts
  const { data: sub } = await supabase
    .from("nexgigs_subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  const tier = sub?.tier ?? "free";
  const PAID_TIERS = [
    "pro", "elite", "premium",
    "business_starter", "business_growth", "enterprise",
  ];
  if (!PAID_TIERS.includes(tier)) {
    return {
      error: "Publishing your storefront requires a paid plan. Free drafts work — upgrade to go live.",
      upgradeRequired: true,
    };
  }

  const me = await getMyStorefront();
  if (!me.storefront) return { error: "No storefront to publish" };
  if (!me.storefront.tagline || !me.storefront.about_html) {
    return { error: "Add a tagline and about section before publishing" };
  }

  const { data, error } = await supabase
    .from("nexgigs_storefronts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await Promise.all([
    notifyDiscord("storefront_published", {
      slug: data.slug,
      industry: data.industry,
      user: user.id,
    }).catch(() => null),
    logAuditEvent(user.id, "storefront.published", "storefront", data.id, {
      slug: data.slug,
    }).catch(() => null),
  ]);

  return { storefront: data as Storefront };
}

/**
 * Move a storefront back to draft (hides it from `/store/<slug>`).
 */
export async function unpublishStorefront(): Promise<{
  storefront?: Storefront;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("nexgigs_storefronts")
    .update({ status: "draft" })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await logAuditEvent(user.id, "storefront.unpublished", "storefront", data.id).catch(
    () => null,
  );
  return { storefront: data as Storefront };
}

// ---------- helpers ----------

function stripScripts(html: string): string {
  // Lightweight defense — strip <script> tags and on-* attributes. The
  // public renderer applies proper sanitize-html before output, so this is
  // belt-and-suspenders only.
  return html
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
}

function sanitizeSocialLinks(input: SocialLinks): SocialLinks {
  const cleanUrl = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return HTTP_RE.test(trimmed) ? trimmed.slice(0, 300) : null;
  };
  const cleanText = (raw: string | null | undefined, max: number): string | null => {
    if (!raw) return null;
    const trimmed = raw.trim();
    return trimmed ? trimmed.slice(0, max) : null;
  };
  return {
    instagram: cleanUrl(input.instagram),
    tiktok: cleanUrl(input.tiktok),
    facebook: cleanUrl(input.facebook),
    x: cleanUrl(input.x),
    youtube: cleanUrl(input.youtube),
    website: cleanUrl(input.website),
    phone: cleanText(input.phone, 30),
    email: cleanText(input.email, 120),
  };
}

// Note: import normalizeSlug directly from "@/lib/storefront-slug" if needed
// — "use server" files cannot re-export sync values.
