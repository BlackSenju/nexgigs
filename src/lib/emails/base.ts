/**
 * Base HTML email wrapper for NexGigs.
 *
 * All customer-facing emails should go through wrapEmail() so they share
 * a consistent brand look, header, footer, and unsubscribe link (legally
 * required under CAN-SPAM).
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  preheader?: string;
}

export interface WrapOptions {
  /** Short preview text shown in email clients before the user opens. */
  readonly preheader?: string;
  /** Override the default footer tagline. */
  readonly tagline?: string;
  /** Override the unsubscribe URL target. */
  readonly unsubscribeUrl?: string;
}

const BASE_URL = "https://nexgigs.com";

export function wrapEmail(content: string, options: WrapOptions = {}): string {
  const preheader = options.preheader ?? "";
  const tagline = options.tagline ?? "Your city. Your skill. Your money.";
  const unsubscribeUrl =
    options.unsubscribeUrl ?? `${BASE_URL}/settings?tab=notifications`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NexGigs</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>` : ""}
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${BASE_URL}" style="text-decoration:none;">
        <span style="font-size:26px;font-weight:900;letter-spacing:-0.5px;">
          <span style="color:#FF4D00;">Nex</span><span style="color:#ffffff;">Gigs</span>
        </span>
      </a>
    </div>

    <!-- Content Card -->
    <div style="background:#141414;border:1px solid #262626;border-radius:16px;padding:32px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0 0;">
      <p style="color:#52525b;font-size:12px;margin:0 0 8px;">${escapeHtml(tagline)}</p>
      <p style="color:#3f3f46;font-size:11px;margin:0 0 12px;">
        <a href="${BASE_URL}" style="color:#FF4D00;text-decoration:none;">nexgigs.com</a>
        &nbsp;&bull;&nbsp;
        <a href="${BASE_URL}/contact" style="color:#71717a;text-decoration:none;">Contact</a>
        &nbsp;&bull;&nbsp;
        <a href="${unsubscribeUrl}" style="color:#71717a;text-decoration:none;">Unsubscribe</a>
      </p>
      <p style="color:#3f3f46;font-size:10px;margin:8px 0 0;line-height:1.5;">
        NexGigs is a marketplace connecting people with independent service providers.
        All payments processed securely through Stripe. Milwaukee, WI.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/** Reusable button component for CTAs. */
export function button(label: string, href: string): string {
  return `<div style="text-align:center;margin:24px 0 8px;">
    <a href="${href}" style="display:inline-block;background:#FF4D00;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">
      ${escapeHtml(label)}
    </a>
  </div>`;
}

/** Reusable secondary (outline) button. */
export function secondaryButton(label: string, href: string): string {
  return `<div style="text-align:center;margin:12px 0;">
    <a href="${href}" style="display:inline-block;background:transparent;color:#FF4D00;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;border:1px solid #FF4D00;">
      ${escapeHtml(label)}
    </a>
  </div>`;
}

/** Reusable info box for highlighting stats or data. */
export function infoBox(label: string, value: string, color = "#FF4D00"): string {
  return `<div style="background:#0a0a0a;border:1px solid #262626;border-radius:10px;padding:16px;margin:16px 0;text-align:center;">
    <p style="color:#71717a;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(label)}</p>
    <p style="color:${color};font-size:24px;font-weight:900;margin:0;">${escapeHtml(value)}</p>
  </div>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
