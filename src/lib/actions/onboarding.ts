"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Onboarding server actions.
 *
 * These update flags on `nexgigs_profiles` that control whether the
 * Welcome Modal, Tour, and Getting Started Checklist are shown on
 * the dashboard. All functions require an authenticated user.
 */

export async function markWelcomeSeen() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("nexgigs_profiles")
    .update({ onboarding_welcomed: true })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function markTourComplete() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("nexgigs_profiles")
    .update({ onboarding_tour_completed: true })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function dismissChecklist() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("nexgigs_profiles")
    .update({ onboarding_checklist_dismissed: true })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export type OnboardingStatus = {
  welcomed: boolean;
  tourCompleted: boolean;
  checklistDismissed: boolean;
  steps: {
    accountCreated: boolean;
    profileComplete: boolean;
    skillsAdded: boolean;
    paymentsSetup: boolean;
    businessProfile: boolean;
  };
};

/** Get the current user's onboarding checklist status. */
export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, skillsRes] = await Promise.all([
    supabase.from("nexgigs_profiles").select("*").eq("id", user.id).single(),
    supabase.from("nexgigs_skills").select("id").eq("user_id", user.id).limit(1),
  ]);

  const profile = profileRes.data;
  if (!profile) return null;

  const hasBio = Boolean(profile.bio && String(profile.bio).length > 10);
  const hasSkills = (skillsRes.data?.length ?? 0) > 0;
  const hasPayments = Boolean(profile.stripe_connect_account_id);
  const hasBusinessProfile = Boolean(profile.business_name);

  return {
    welcomed: Boolean(profile.onboarding_welcomed),
    tourCompleted: Boolean(profile.onboarding_tour_completed),
    checklistDismissed: Boolean(profile.onboarding_checklist_dismissed),
    steps: {
      accountCreated: true,
      profileComplete: hasBio,
      skillsAdded: hasSkills,
      paymentsSetup: hasPayments,
      businessProfile: hasBusinessProfile,
    },
  };
}
