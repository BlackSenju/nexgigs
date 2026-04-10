/**
 * Admin notification system — Discord + Email + DB log.
 *
 * Modeled on NexPaths' admin-notify pattern. Fire-and-forget; never blocks
 * the request flow. If any individual channel fails, the others still try.
 *
 * Env vars:
 *   ADMIN_EMAIL — where to send the email notifications
 *   DISCORD_WEBHOOK_SIGNUPS / DISCORD_WEBHOOK_URL — Discord webhook
 *   RESEND_API_KEY — Resend API key (used by sendEmail)
 */

import { sendEmail } from "@/lib/email";
import { notifyDiscord } from "@/lib/discord";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export interface AdminNotification {
  readonly eventType:
    | "new_signup"
    | "new_subscription"
    | "subscription_cancelled"
    | "payment_received"
    | "payment_failed"
    | "ghost_reported"
    | "support_ticket"
    | "security_alert"
    | "account_deleted"
    | "manual";
  readonly title: string;
  readonly description?: string;
  readonly metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface NotifyAdminResult {
  discord: { sent: boolean; error?: string };
  email: { sent: boolean; error?: string };
}

/**
 * Notify the admin via Discord AND email.
 * Returns a Promise that resolves after BOTH channels complete (or fail).
 *
 * IMPORTANT: Always await this in server components / server actions.
 * Fire-and-forget does NOT work on Vercel — serverless functions kill
 * pending promises the moment the response is sent.
 */
export async function notifyAdmin(
  notification: AdminNotification
): Promise<NotifyAdminResult> {
  const [discordResult, emailResult] = await Promise.allSettled([
    sendDiscord(notification),
    sendAdminEmail(notification),
  ]);

  return {
    discord:
      discordResult.status === "fulfilled"
        ? { sent: true }
        : {
            sent: false,
            error:
              discordResult.reason instanceof Error
                ? discordResult.reason.message
                : String(discordResult.reason),
          },
    email:
      emailResult.status === "fulfilled"
        ? { sent: true }
        : {
            sent: false,
            error:
              emailResult.reason instanceof Error
                ? emailResult.reason.message
                : String(emailResult.reason),
          },
  };
}

/** @deprecated Use `notifyAdmin` — it now returns a Promise. */
export const notifyAdminSync = notifyAdmin;

async function sendDiscord(n: AdminNotification): Promise<void> {
  // Map our admin events to the existing notifyDiscord event types
  const discordEventMap: Record<AdminNotification["eventType"], string> = {
    new_signup: "new_signup",
    new_subscription: "subscription_upgraded",
    subscription_cancelled: "security_alert",
    payment_received: "payment_received",
    payment_failed: "security_alert",
    ghost_reported: "ghost_report",
    support_ticket: "security_alert",
    security_alert: "security_alert",
    account_deleted: "security_alert",
    manual: "security_alert",
  };

  const event = discordEventMap[n.eventType];

  // Flatten metadata into the data shape that notifyDiscord expects.
  // For new_signup we map specific fields it knows about.
  if (n.eventType === "new_signup") {
    await notifyDiscord("new_signup", {
      name: String(n.metadata?.name ?? n.title),
      accountType: String(n.metadata?.accountType ?? "member"),
      city: String(n.metadata?.city ?? ""),
      state: String(n.metadata?.state ?? ""),
    });
    return;
  }

  // Generic fallback — pass title + description as the message
  await notifyDiscord(event as Parameters<typeof notifyDiscord>[0], {
    message: `${n.title}${n.description ? ` — ${n.description}` : ""}`,
    user: String(n.metadata?.email ?? n.metadata?.userId ?? "unknown"),
    ip: "n/a",
  });
}

async function sendAdminEmail(n: AdminNotification): Promise<void> {
  if (!ADMIN_EMAIL) {
    throw new Error("ADMIN_EMAIL env var not set");
  }

  const metaRows = n.metadata
    ? Object.entries(n.metadata)
        .filter(([, v]) => v != null && v !== "")
        .map(
          ([k, v]) =>
            `<tr><td style="color:#a1a1aa;padding:4px 12px 4px 0;font-size:13px;">${escapeHtml(k)}</td><td style="color:#ffffff;font-size:13px;">${escapeHtml(String(v))}</td></tr>`
        )
        .join("")
    : "";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;">
        <span style="color:#FF4D00;">Nex</span><span style="color:#ffffff;">Gigs</span>
        <span style="color:#71717a;font-size:11px;margin-left:8px;font-weight:600;">ADMIN</span>
      </span>
    </div>
    <div style="background:#1a1a1a;border:1px solid #2d2d2d;border-radius:12px;padding:24px;">
      <h2 style="color:#FF4D00;font-size:16px;font-weight:700;margin:0 0 8px;">${escapeHtml(n.title)}</h2>
      ${n.description ? `<p style="color:#a1a1aa;font-size:14px;line-height:1.5;margin:0 0 16px;">${escapeHtml(n.description)}</p>` : ""}
      ${metaRows ? `<table style="width:100%;border-collapse:collapse;">${metaRows}</table>` : ""}
      <p style="color:#52525b;font-size:11px;margin:16px 0 0;border-top:1px solid #2d2d2d;padding-top:12px;">
        Event: ${escapeHtml(n.eventType)} &bull; ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })}
      </p>
    </div>
    <p style="text-align:center;color:#3f3f46;font-size:11px;margin-top:16px;">
      <a href="https://nexgigs.com/admin" style="color:#FF4D00;text-decoration:underline;">Open Admin Dashboard</a>
    </p>
  </div>
</body>
</html>`;

  const result = await sendEmail(ADMIN_EMAIL, `[NexGigs] ${n.title}`, html);
  if (!result.success) {
    throw new Error(result.error ?? "sendEmail returned failure");
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
