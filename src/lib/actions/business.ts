"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

/**
 * Update business profile fields on nexgigs_profiles.
 */
export async function updateBusinessProfile(input: {
  businessName: string;
  businessType: string;
  businessDescription?: string;
  businessWebsite?: string;
  hiringCategories?: string[];
  teamSize?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Validate required fields
  if (!input.businessName.trim()) {
    return { error: "Business name is required" };
  }
  if (!input.businessType) {
    return { error: "Business type is required" };
  }

  const validTypes = ["sole_proprietor", "llc", "corporation", "nonprofit", "franchise"];
  if (!validTypes.includes(input.businessType)) {
    return { error: "Invalid business type" };
  }

  const validTeamSizes = ["1", "2-5", "6-10", "11-25", "26-50", "50+"];
  if (input.teamSize && !validTeamSizes.includes(input.teamSize)) {
    return { error: "Invalid team size" };
  }

  // Validate website URL format if provided. We must explicitly check the
  // protocol — `new URL("javascript:alert(1)")` parses successfully and
  // would otherwise sail through. Only http(s) is allowed.
  if (input.businessWebsite) {
    let parsed: URL;
    try {
      parsed = new URL(input.businessWebsite);
    } catch {
      return { error: "Invalid website URL. Include https://" };
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { error: "Website must use http:// or https://" };
    }
  }

  const { error } = await supabase
    .from("nexgigs_profiles")
    .update({
      business_name: input.businessName.trim(),
      business_type: input.businessType,
      business_description: input.businessDescription?.trim() || null,
      business_website: input.businessWebsite?.trim() || null,
      hiring_categories: input.hiringCategories ?? [],
      team_size: input.teamSize || null,
      is_poster: true,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  await logAuditEvent(user.id, "profile.updated", "profile", user.id, {
    action: "business_profile_setup",
  });

  return { success: true };
}

/**
 * Fetch business profile data for a given user.
 */
export async function getBusinessProfile(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("nexgigs_profiles")
    .select(
      "id, first_name, last_initial, business_name, business_type, business_description, business_website, business_logo_url, business_verified, hiring_categories, team_size, is_poster, created_at"
    )
    .eq("id", userId)
    .single();

  if (error) return { profile: null, error: error.message };
  return { profile: data };
}

/**
 * Fetch all jobs posted by a specific business/user.
 */
export async function getBusinessListings(businessId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("nexgigs_jobs")
    .select("*, applications:nexgigs_applications(count)")
    .eq("poster_id", businessId)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { jobs: [], error: error.message };
  return { jobs: data ?? [] };
}
