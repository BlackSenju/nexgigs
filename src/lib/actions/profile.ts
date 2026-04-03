"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

/**
 * Update user profile fields.
 */
export async function updateProfile(updates: {
  bio?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  neighborhood?: string;
  languages?: string[];
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("nexgigs_profiles")
    .update({
      bio: updates.bio,
      city: updates.city,
      state: updates.state?.toUpperCase(),
      zip_code: updates.zipCode,
      neighborhood: updates.neighborhood,
      languages: updates.languages,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  await logAuditEvent(user.id, "profile.updated", "profile", user.id);
  return { success: true };
}

/**
 * Add a skill to user profile.
 */
export async function addSkill(input: {
  skillName: string;
  category: string;
  experienceYears?: number;
  isLicensed?: boolean;
  licenseNumber?: string;
  certificationName?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check for duplicate
  const { data: existing } = await supabase
    .from("nexgigs_skills")
    .select("id")
    .eq("user_id", user.id)
    .eq("skill_name", input.skillName)
    .maybeSingle();

  if (existing) return { error: "You already have this skill" };

  const { data: skill, error } = await supabase
    .from("nexgigs_skills")
    .insert({
      user_id: user.id,
      skill_name: input.skillName,
      category: input.category,
      experience_years: input.experienceYears ?? 0,
      is_licensed: input.isLicensed ?? false,
      license_number: input.licenseNumber,
      certification_name: input.certificationName,
      is_certified: !!input.certificationName,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { skill };
}

/**
 * Remove a skill.
 */
export async function removeSkill(skillId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("nexgigs_skills")
    .delete()
    .eq("id", skillId)
    .eq("user_id", user.id);

  return error ? { error: error.message } : { success: true };
}
