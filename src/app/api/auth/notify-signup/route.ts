import { NextRequest, NextResponse } from "next/server";
import { notifyDiscord } from "@/lib/discord";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/auth/notify-signup
 * Called from the OAuth callback to notify on new signups.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name, accountType, provider } = body;

    await Promise.all([
      notifyDiscord("new_signup", {
        name: name ?? "Unknown",
        accountType: `${accountType} (${provider})`,
        city: "TBD",
        state: "",
      }),
      (() => {
        const welcomeData = welcomeEmail(
          name?.split(" ")[0] ?? "there",
          accountType ?? "gigger"
        );
        return sendEmail(email, welcomeData.subject, welcomeData.html);
      })(),
      logAuditEvent(userId, "auth.signup", "user", userId, {
        provider,
        accountType,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
