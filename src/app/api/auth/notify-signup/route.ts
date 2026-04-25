import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyDiscord } from "@/lib/discord";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";

const VALID_ACCOUNT_TYPES = ["gigger", "poster", "shop"] as const;
const VALID_PROVIDERS = ["google", "apple", "email"] as const;

type AccountType = (typeof VALID_ACCOUNT_TYPES)[number];
type Provider = (typeof VALID_PROVIDERS)[number];

function sanitizeName(raw: unknown): string {
  if (typeof raw !== "string") return "there";
  // Cap length, strip control chars + HTML angle brackets to keep email safe
  const cleaned = raw.replace(/[\x00-\x1f<>]/g, "").trim().slice(0, 80);
  return cleaned.length > 0 ? cleaned : "there";
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/**
 * POST /api/auth/notify-signup
 *
 * Called from the OAuth callback after a successful sign-in to fire welcome
 * notifications. Authenticated callers only — the userId and email are
 * derived from the server-side Supabase session, NOT from the request body,
 * to prevent log poisoning and email abuse.
 *
 * Body (all fields advisory; only used as labels):
 *   - accountType: "gigger" | "poster" | "shop"
 *   - provider: "google" | "apple" | "email"
 *   - name: optional display name (sanitized)
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // body is optional
  }

  const accountType: AccountType = pick(body.accountType, VALID_ACCOUNT_TYPES, "gigger");
  const provider: Provider = pick(body.provider, VALID_PROVIDERS, "email");
  const name = sanitizeName(body.name);

  try {
    await Promise.all([
      notifyDiscord("new_signup", {
        name,
        accountType: `${accountType} (${provider})`,
        city: "TBD",
        state: "",
      }),
      (() => {
        const firstName = name.split(" ")[0] ?? "there";
        const welcomeData = welcomeEmail(firstName);
        return sendEmail(user.email!, welcomeData.subject, welcomeData.html);
      })(),
      logAuditEvent(user.id, "auth.signup", "user", user.id, {
        provider,
        accountType,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[auth/notify-signup] handler error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
