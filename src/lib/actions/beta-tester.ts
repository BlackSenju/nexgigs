"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { notifyDiscord } from "@/lib/discord";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  deviceType: z.enum(["android", "ios", "other"]).default("android"),
  notes: z.string().max(500).optional(),
});

export async function signupBetaTester(input: {
  email: string;
  deviceType?: "android" | "ios" | "other";
  notes?: string;
}) {
  // Validate input
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = createAdminClient();

  // Check if already signed up
  const { data: existing } = await supabase
    .from("nexgigs_beta_testers")
    .select("id, invited")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (existing) {
    return {
      success: true,
      alreadySignedUp: true,
      message: existing.invited
        ? "You've already been invited! Check your email for the Play Store link."
        : "You're already on the list! We'll email you when testing opens.",
    };
  }

  // Insert new tester
  const { error } = await supabase.from("nexgigs_beta_testers").insert({
    email: parsed.data.email,
    device_type: parsed.data.deviceType,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return { error: "Failed to sign up. Please try again." };
  }

  // Notify Discord
  notifyDiscord("new_signup", {
    name: parsed.data.email,
    accountType: `Beta Tester (${parsed.data.deviceType})`,
    city: "",
    state: "",
  }).catch(() => {});

  return {
    success: true,
    message: "You're on the list! We'll email you when testing opens.",
  };
}
