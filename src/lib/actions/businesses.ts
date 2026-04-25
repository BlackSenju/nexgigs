"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { notifyDiscord } from "@/lib/discord";
import {
  validateSlug,
  suggestAvailableSlug,
} from "@/lib/storefront-slug";

/**
 * Business record shape (mirrors nexgigs_businesses schema).
 */
export interface Business {
  id: string;
  owner_user_id: string;
  slug: string;
  name: string;
  business_type: BusinessType;
  status: BusinessStatus;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  team_size: string | null;
  hiring_categories: string[] | null;
  city: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
}

export type BusinessStatus = "pending" | "approved" | "rejected" | "suspended";

export type BusinessType =
  | "sole_proprietor"
  | "llc"
  | "corporation"
  | "nonprofit"
  | "franchise"
  | "other";

const HTTP_RE = /^https?:\/\//i;
// Cookie name is intentionally NOT exported — "use server" files can only
// export async functions. The constant is only read/written inside this
// module (getActiveIdentity / setActiveIdentity).
const ACTIVE_IDENTITY_COOKIE = "nexgigs_active_identity";

/**
 * The identity the user is currently acting as. "personal" means their own
 * profile; otherwise it's a business UUID they own. Validated server-side
 * on every server action read so a tampered cookie can't impersonate.
 */
export type ActiveIdentity =
  | { kind: "personal" }
  | { kind: "business"; businessId: string; business: Business };

// ---------- read helpers ----------

export async function getMyBusinesses(): Promise<{ businesses: Business[]; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { businesses: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("nexgigs_businesses")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return { businesses: [], error: error.message };
  return { businesses: (data ?? []) as Business[] };
}

export async function getBusinessById(id: string): Promise<{
  business: Business | null;
  error?: string;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("nexgigs_businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { business: null, error: error.message };
  return { business: (data as Business | null) ?? null };
}

export async function getBusinessBySlug(slug: string): Promise<{
  business: Business | null;
  error?: string;
}> {
  const validation = validateSlug(slug);
  if (validation) return { business: null, error: validation.message };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("nexgigs_businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return { business: null, error: error.message };
  return { business: (data as Business | null) ?? null };
}

/**
 * Resolve the current "acting as" identity. Reads the cookie, validates
 * that the user actually owns the named business, and falls back to
 * personal if anything is off.
 */
export async function getActiveIdentity(): Promise<ActiveIdentity> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { kind: "personal" };

  const raw = cookies().get(ACTIVE_IDENTITY_COOKIE)?.value;
  if (!raw || raw === "personal") return { kind: "personal" };

  // Treat as a business UUID — verify ownership
  const { data, error } = await supabase
    .from("nexgigs_businesses")
    .select("*")
    .eq("id", raw)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (error || !data) return { kind: "personal" };
  return { kind: "business", businessId: data.id, business: data as Business };
}

// ---------- mutations ----------

export async function setActiveIdentity(
  value: "personal" | { businessId: string },
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  let cookieValue = "personal";
  if (typeof value === "object") {
    // Verify the user owns this business before accepting it
    const { data } = await supabase
      .from("nexgigs_businesses")
      .select("id")
      .eq("id", value.businessId)
      .eq("owner_user_id", user.id)
      .maybeSingle();
    if (!data) return { ok: false, error: "Business not found" };
    cookieValue = value.businessId;
  }

  cookies().set(ACTIVE_IDENTITY_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return { ok: true };
}

export interface CreateBusinessInput {
  name: string;
  baseSlug?: string;
  business_type?: BusinessType;
  description?: string;
  website?: string;
  city?: string;
  state?: string;
  team_size?: string;
  hiring_categories?: string[];
}

/**
 * Create a new business owned by the calling user. Status starts at 'pending'
 * — admins approve via the admin panel (or Discord). Auto-suggests an
 * available slug from the business name if one isn't supplied.
 */
export async function createBusiness(input: CreateBusinessInput): Promise<{
  business?: Business;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = input.name?.trim();
  if (!name || name.length > 120) return { error: "Business name is required" };

  const slug = await suggestAvailableSlug(input.baseSlug || name, async (cand) => {
    const { data } = await supabase
      .from("nexgigs_businesses")
      .select("id")
      .eq("slug", cand)
      .maybeSingle();
    return !!data;
  });
  if (!slug) return { error: "Could not generate an available URL — please pick one manually" };

  // Validate website if provided
  let website: string | null = null;
  if (input.website) {
    const trimmed = input.website.trim();
    if (trimmed) {
      try {
        const u = new URL(trimmed);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          return { error: "Website must use http:// or https://" };
        }
        website = u.toString();
      } catch {
        return { error: "Invalid website URL" };
      }
    }
  }

  const { data, error } = await supabase
    .from("nexgigs_businesses")
    .insert({
      owner_user_id: user.id,
      slug,
      name,
      business_type: input.business_type ?? "sole_proprietor",
      status: "pending",
      description: input.description?.slice(0, 5000) ?? null,
      website,
      city: input.city?.slice(0, 80) ?? null,
      state: input.state?.slice(0, 4)?.toUpperCase() ?? null,
      team_size: input.team_size ?? null,
      hiring_categories: input.hiring_categories ?? [],
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  // Side effects (best-effort): admin notification + audit log.
  await Promise.all([
    notifyDiscord("business_created", {
      slug,
      name,
      owner: user.id,
      city: data.city ?? "",
      state: data.state ?? "",
    }).catch(() => null),
    logAuditEvent(user.id, "business.created", "business", data.id, {
      slug,
      name,
    }).catch(() => null),
  ]);

  return { business: data as Business };
}

export interface UpdateBusinessInput {
  id: string;
  name?: string;
  business_type?: BusinessType;
  description?: string | null;
  website?: string | null;
  city?: string | null;
  state?: string | null;
  team_size?: string | null;
  hiring_categories?: string[] | null;
  logo_url?: string | null;
}

export async function updateBusiness(input: UpdateBusinessInput): Promise<{
  business?: Business;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const n = input.name.trim();
    if (!n || n.length > 120) return { error: "Business name must be 1-120 characters" };
    patch.name = n;
  }
  if (input.business_type !== undefined) patch.business_type = input.business_type;
  if (input.description !== undefined) patch.description = input.description?.slice(0, 5000) ?? null;
  if (input.website !== undefined) {
    if (input.website && !HTTP_RE.test(input.website)) {
      return { error: "Website must use http:// or https://" };
    }
    patch.website = input.website?.slice(0, 500) ?? null;
  }
  if (input.city !== undefined) patch.city = input.city?.slice(0, 80) ?? null;
  if (input.state !== undefined) patch.state = input.state?.slice(0, 4).toUpperCase() ?? null;
  if (input.team_size !== undefined) patch.team_size = input.team_size;
  if (input.hiring_categories !== undefined)
    patch.hiring_categories = input.hiring_categories ?? [];
  if (input.logo_url !== undefined) {
    if (input.logo_url && !HTTP_RE.test(input.logo_url)) {
      return { error: "Logo URL must use http:// or https://" };
    }
    patch.logo_url = input.logo_url?.slice(0, 500) ?? null;
  }

  if (Object.keys(patch).length === 0) return { error: "Nothing to update" };

  const { data, error } = await supabase
    .from("nexgigs_businesses")
    .update(patch)
    .eq("id", input.id)
    .eq("owner_user_id", user.id)
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { business: data as Business };
}

// ---------- admin actions ----------

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("nexgigs_profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data?.is_admin);
}

export async function approveBusinessAdmin(businessId: string): Promise<{
  business?: Business;
  error?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!(await isAdmin(user.id))) return { error: "Admin only" };

  const { data, error } = await supabase
    .from("nexgigs_businesses")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      rejection_reason: null,
    })
    .eq("id", businessId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await logAuditEvent(user.id, "admin.action", "business", businessId, {
    action: "business.approved",
  }).catch(() => null);

  return { business: data as Business };
}

export async function rejectBusinessAdmin(
  businessId: string,
  reason: string,
): Promise<{ business?: Business; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!(await isAdmin(user.id))) return { error: "Admin only" };

  const { data, error } = await supabase
    .from("nexgigs_businesses")
    .update({
      status: "rejected",
      rejection_reason: reason.slice(0, 500),
    })
    .eq("id", businessId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await logAuditEvent(user.id, "admin.action", "business", businessId, {
    action: "business.rejected",
    reason: reason.slice(0, 500),
  }).catch(() => null);

  return { business: data as Business };
}
