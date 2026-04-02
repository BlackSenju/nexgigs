"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signupSchema, loginSchema, type SignupInput, type LoginInput } from "@/lib/validations/auth";

export async function signup(input: SignupInput) {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
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
      is_gigger: parsed.data.accountType === "gigger",
      is_poster: parsed.data.accountType === "poster",
    });

  if (profileError) {
    return { error: "Account created but profile setup failed. Please contact support." };
  }

  // Create XP record
  await supabase.from("nexgigs_user_xp").insert({
    user_id: data.user.id,
  });

  // Create ratings record
  await supabase.from("nexgigs_user_ratings").insert({
    user_id: data.user.id,
  });

  redirect("/dashboard");
}

export async function login(input: LoginInput) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid email or password" };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
