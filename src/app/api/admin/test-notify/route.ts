import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/admin-notify";

/**
 * GET /api/admin/test-notify
 *
 * Diagnostic endpoint — sends a test notification to Discord AND email
 * and returns the result of each channel. Admin only.
 *
 * Use this to verify env vars and webhook URLs are correctly configured
 * in production without having to sign up a new user.
 */
export async function GET() {
  // Require admin
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("is_admin, first_name, last_initial")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // Collect config info (without leaking secrets)
  const config = {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL
      ? process.env.ADMIN_EMAIL.replace(/(.{2}).*@/, "$1***@")
      : "NOT SET",
    DISCORD_WEBHOOK_SIGNUPS: process.env.DISCORD_WEBHOOK_SIGNUPS
      ? "SET (" + process.env.DISCORD_WEBHOOK_SIGNUPS.slice(0, 40) + "...)"
      : "NOT SET",
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL
      ? "SET (" + process.env.DISCORD_WEBHOOK_URL.slice(0, 40) + "...)"
      : "NOT SET",
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "SET" : "NOT SET",
  };

  // Fire a test notification
  const result = await notifyAdmin({
    eventType: "new_signup",
    title: "TEST: Notification Diagnostic",
    description: `Test notification triggered by ${profile.first_name} ${profile.last_initial}. at ${new Date().toLocaleString()}`,
    metadata: {
      email: user.email ?? "unknown",
      name: `${profile.first_name} ${profile.last_initial}.`,
      accountType: "test",
      city: "Test City",
      state: "TS",
      provider: "diagnostic",
      userId: user.id,
    },
  });

  return NextResponse.json({
    success: result.discord.sent && result.email.sent,
    result,
    config,
    instructions: {
      discord:
        result.discord.sent
          ? "✅ Discord notification sent — check your Discord channel."
          : `❌ Discord failed: ${result.discord.error}. Check DISCORD_WEBHOOK_SIGNUPS or DISCORD_WEBHOOK_URL in Vercel.`,
      email:
        result.email.sent
          ? "✅ Email sent — check your inbox (and spam folder)."
          : `❌ Email failed: ${result.email.error}. Check ADMIN_EMAIL and RESEND_API_KEY in Vercel, and verify the sender domain in Resend.`,
    },
  });
}
