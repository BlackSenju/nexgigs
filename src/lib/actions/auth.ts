"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  signupSchema,
  loginSchema,
  type SignupInput,
  type LoginInput,
} from "@/lib/validations/auth";
import { notifyDiscord } from "@/lib/discord";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

export async function signup(input: SignupInput) {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Rate limit by email
  const rateCheck = checkRateLimit(`signup:${parsed.data.email}`);
  if (!rateCheck.allowed) {
    return { error: "Too many signup attempts. Please try again later." };
  }

  const supabase = createClient();
  const { data, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (!data.user) {
    return { error: "Failed to create account" };
  }

  const displayName = `${parsed.data.firstName} ${parsed.data.lastInitial.toUpperCase()}.`;

  // Create profile
  const { error: profileError } = await supabase
    .from("nexgigs_profiles")
    .insert({
      id: data.user.id,
      first_name: parsed.data.firstName,
      last_initial: parsed.data.lastInitial.toUpperCase(),
      city: parsed.data.city,
      state: parsed.data.state.toUpperCase(),
      zip_code: parsed.data.zipCode,
      // All new members get full access — can both earn (gigger) and hire (poster)
      is_gigger: true,
      is_poster: true,
    });

  if (profileError) {
    return {
      error:
        "Account created but profile setup failed. Please contact support.",
    };
  }

  // Create XP and ratings records (fire-and-forget)
  await Promise.all([
    supabase.from("nexgigs_user_xp").insert({ user_id: data.user.id }),
    supabase.from("nexgigs_user_ratings").insert({ user_id: data.user.id }),
  ]);

  // Fire-and-forget: notifications, email, audit log
  Promise.all([
    notifyDiscord("new_signup", {
      name: displayName,
      accountType: parsed.data.accountType,
      city: parsed.data.city,
      state: parsed.data.state.toUpperCase(),
    }),
    (() => {
      const email = welcomeEmail(parsed.data.firstName, parsed.data.accountType);
      return sendEmail(parsed.data.email, email.subject, email.html);
    })(),
    logAuditEvent(data.user.id, "auth.signup", "user", data.user.id, {
      accountType: parsed.data.accountType,
      city: parsed.data.city,
      state: parsed.data.state,
    }),
  ]).catch(() => {
    // Notifications are non-critical — don't block signup
  });

  redirect("/dashboard");
}

export async function login(input: LoginInput) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Rate limit by email
  const rateCheck = checkRateLimit(`login:${parsed.data.email}`);
  if (!rateCheck.allowed) {
    await logAuditEvent(null, "auth.failed_login", "user", undefined, {
      email: parsed.data.email,
      reason: "rate_limited",
    });
    await notifyDiscord("security_alert", {
      message: `Rate limit hit for login: ${parsed.data.email}`,
      user: parsed.data.email,
    });
    return {
      error: "Too many login attempts. Please try again in 15 minutes.",
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    await logAuditEvent(null, "auth.failed_login", "user", undefined, {
      email: parsed.data.email,
      reason: "invalid_credentials",
    });
    return { error: "Invalid email or password" };
  }

  // Check if user has MFA enabled
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verifiedFactors = factors?.totp?.filter(
    (f) => f.status === "verified"
  );

  if (verifiedFactors && verifiedFactors.length > 0) {
    // User has MFA — redirect to MFA challenge page
    return { mfaRequired: true, factorId: verifiedFactors[0].id };
  }

  // Fire-and-forget: audit log
  const userId = data.user?.id;
  if (userId) {
    logAuditEvent(userId, "auth.login", "user", userId).catch(() => {});
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    logAuditEvent(user.id, "auth.logout", "user", user.id).catch(() => {});
  }

  await supabase.auth.signOut();
  redirect("/");
}
