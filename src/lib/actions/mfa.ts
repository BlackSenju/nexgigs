"use server";

import { createClient } from "@/lib/supabase/server";

export async function enrollMFA() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Authenticator App",
  });

  if (error) return { error: error.message };

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

export async function verifyMFAEnrollment(factorId: string, code: string) {
  const supabase = createClient();

  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });

  if (challengeError) return { error: challengeError.message };

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });

  if (verifyError) return { error: verifyError.message };

  return { success: true };
}

export async function challengeMFA(factorId: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.mfa.challenge({ factorId });

  if (error) return { error: error.message };

  return { challengeId: data.id };
}

export async function verifyMFA(factorId: string, challengeId: string, code: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (error) return { error: error.message };

  return { success: true };
}

export async function getMFAFactors() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error) return { error: error.message };

  const totpFactors = data.totp.filter((f) => f.status === "verified");

  return {
    hasMFA: totpFactors.length > 0,
    factors: totpFactors.map((f) => ({
      id: f.id,
      name: f.friendly_name,
      createdAt: f.created_at,
    })),
  };
}

export async function unenrollMFA(factorId: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.mfa.unenroll({ factorId });

  if (error) return { error: error.message };

  return { success: true };
}

export async function getAAL() {
  const supabase = createClient();

  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error) return { currentLevel: "aal1" as const };

  return {
    currentLevel: data.currentLevel,
    nextLevel: data.nextLevel,
  };
}
