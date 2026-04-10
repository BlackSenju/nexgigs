import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Configurable sender. Set EMAIL_FROM in Vercel once nexgigs.com is verified
// in Resend (https://resend.com/domains). Until then, fall back to Resend's
// default test sender so transactional emails still go out.
const FROM_EMAIL =
  process.env.EMAIL_FROM ?? "NexGigs <onboarding@resend.dev>";

interface EmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email");
    return { success: false, error: "Email not configured" };
  }

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Failed to send:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

// --- Email Templates ---
// Templates moved to src/lib/emails/templates.ts for cleaner organization.
// Re-exported here so existing callers don't break.
export {
  welcomeEmail,
  newApplicationEmail,
  newMessageEmail,
  jobPostedEmail,
  hiredEmail,
  jobMatchesDigestEmail,
} from "./emails/templates";

/** @deprecated Use newApplicationEmail — old signature with positional args. */
export function applicationReceivedEmail(
  posterName: string,
  giggerName: string,
  jobTitle: string,
  bidAmount: number
): { subject: string; html: string } {
  const parts = giggerName.trim().split(" ");
  const giggerFirstName = parts[0] ?? "User";
  const giggerLastInitial = (parts[1]?.[0] ?? "X").toUpperCase();

  // Lazy import to avoid circular deps at module load
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { newApplicationEmail: impl } = require("./emails/templates");
  return impl({
    posterFirstName: posterName,
    giggerFirstName,
    giggerLastInitial,
    jobTitle,
    bidAmount,
    jobId: "",
  });
}

/** @deprecated Use hiredEmail or a custom job completion template. */
export function jobCompletedEmail(
  name: string,
  jobTitle: string,
  amount: number,
  role: "gigger" | "poster"
): { subject: string; html: string } {
  // Lazy import to avoid circular deps at module load
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { hiredEmail: impl } = require("./emails/templates");
  if (role === "gigger") {
    return impl({
      giggerFirstName: name,
      jobTitle,
      jobId: "",
      posterFirstName: "the poster",
      agreedPrice: amount,
    });
  }
  // Simple poster-side completion email
  return {
    subject: `Job completed: "${jobTitle}"`,
    html: `<p>Hey ${name}, your job "${jobTitle}" is marked complete. Please leave a rating.</p>`,
  };
}
