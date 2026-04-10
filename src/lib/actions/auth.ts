"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Use admin client for profile creation — bypasses RLS since
  // the new user is not yet authenticated when signup runs
  const admin = createAdminClient();

  // Create profile (idempotent — upsert in case row already exists)
  const { error: profileError } = await admin
    .from("nexgigs_profiles")
    .upsert({
      id: data.user.id,
      first_name: parsed.data.firstName,
      last_initial: parsed.data.lastInitial.toUpperCase(),
      city: parsed.data.city,
      state: parsed.data.state.toUpperCase(),
      zip_code: parsed.data.zipCode,
      // All new members get full access — can both earn (gigger) and hire (poster)
      is_gigger: true,
      is_poster: true,
    }, { onConflict: "id" });

  if (profileError) {
    // Surface the real error so we can debug
    return {
      error: `Profile setup failed: ${profileError.message}`,
    };
  }

  // Create XP and ratings records — try insert, ignore if already exists
  await Promise.all([
    admin
      .from("nexgigs_user_xp")
      .insert({ user_id: data.user.id })
      .then(() => null, () => null),
    admin
      .from("nexgigs_user_ratings")
      .insert({ user_id: data.user.id })
      .then(() => null, () => null),
  ]);

  // AWAIT notifications BEFORE redirect — fire-and-forget doesn't work
  // reliably in Next.js server actions because redirect() throws
  // immediately and the function context is destroyed
  await Promise.all([
    notifyDiscord("new_signup", {
      name: displayName,
      accountType: parsed.data.accountType,
      city: parsed.data.city,
      state: parsed.data.state.toUpperCase(),
    }).catch(() => null),
    (async () => {
      try {
        const email = welcomeEmail(
          parsed.data.firstName,
          parsed.data.accountType
        );
        await sendEmail(parsed.data.email, email.subject, email.html);
      } catch {
        // Email failure shouldn't block signup
      }
    })(),
    logAuditEvent(data.user.id, "auth.signup", "user", data.user.id, {
      accountType: parsed.data.accountType,
      city: parsed.data.city,
      state: parsed.data.state,
    }).catch(() => null),
  ]);

  redirect("/dashboard");
}

/**
 * Create or upsert the profile for an OAuth (Google) signup.
 * Called from the OAuth callback page after exchangeCodeForSession.
 *
 * Uses the admin client to bypass RLS and verifies the requesting user
 * matches the userId being created so randos can't create profiles for
 * other people.
 */
export async function ensureOAuthProfile(input: {
  firstName: string;
  lastInitial: string;
  accountType?: "gigger" | "poster";
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  // Check if profile already exists
  const { data: existing } = await admin
    .from("nexgigs_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { success: true, alreadyExists: true };
  }

  const firstName = input.firstName?.trim() || (user.email?.split("@")[0] ?? "User");
  const lastInitial = (input.lastInitial?.trim() || "X").charAt(0).toUpperCase();

  // Create profile
  const { error: profileError } = await admin
    .from("nexgigs_profiles")
    .insert({
      id: user.id,
      first_name: firstName,
      last_initial: lastInitial,
      city: "",
      state: "",
      zip_code: "",
      is_gigger: true,
      is_poster: true,
    });

  if (profileError) {
    return { error: `Profile creation failed: ${profileError.message}` };
  }

  // Create XP and ratings rows (best-effort)
  await Promise.all([
    admin.from("nexgigs_user_xp").insert({ user_id: user.id }).then(() => null, () => null),
    admin.from("nexgigs_user_ratings").insert({ user_id: user.id }).then(() => null, () => null),
  ]);

  // Discord notification + audit log (await so they fire before client redirects away)
  const displayName = `${firstName} ${lastInitial}.`;
  await Promise.all([
    notifyDiscord("new_signup", {
      name: displayName,
      accountType: input.accountType ?? "gigger",
      city: "",
      state: "",
    }).catch(() => null),
    logAuditEvent(user.id, "auth.signup", "user", user.id, {
      accountType: input.accountType ?? "gigger",
      provider: "google",
    }).catch(() => null),
  ]);

  return { success: true };
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
