import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "NexGigs <notifications@nexgigs.com>";

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
    const { error } = await resend.emails.send({
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

function wrapTemplate(content: string): string {
  return `
    <div style="background-color:#0a0a0a;padding:40px 20px;font-family:'Inter',system-ui,sans-serif;">
      <div style="max-width:500px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:30px;">
          <span style="color:#FF4D00;font-size:24px;font-weight:900;">NexGigs</span>
        </div>
        <div style="background-color:#2D2D2D;border-radius:12px;padding:30px;color:#ffffff;">
          ${content}
        </div>
        <div style="text-align:center;margin-top:20px;color:#6b7280;font-size:12px;">
          <p>Your city. Your skill. Your money.</p>
          <p>&copy; ${new Date().getFullYear()} NexGigs. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

export function welcomeEmail(name: string, accountType: string): { subject: string; html: string } {
  const isGigger = accountType === "gigger";
  return {
    subject: `Welcome to NexGigs, ${name}!`,
    html: wrapTemplate(`
      <h2 style="color:#FF4D00;margin:0 0 15px 0;font-size:20px;">Welcome to NexGigs!</h2>
      <p style="color:#e5e5e5;line-height:1.6;margin:0 0 15px 0;">
        Hey ${name}, you're in! ${
          isGigger
            ? "Your city is full of people who need your skills. Start browsing gigs and earning today."
            : "Find talented people in your community ready to help. Post your first job now."
        }
      </p>
      <div style="text-align:center;margin:25px 0;">
        <a href="https://nexgigs.com/${isGigger ? "jobs" : "jobs/post"}"
           style="background-color:#FF4D00;color:#ffffff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
          ${isGigger ? "Browse Jobs" : "Post a Job"}
        </a>
      </div>
      <p style="color:#9ca3af;font-size:13px;margin:0;">
        Questions? Reply to this email and we'll help you out.
      </p>
    `),
  };
}

export function jobPostedEmail(posterName: string, jobTitle: string): { subject: string; html: string } {
  return {
    subject: `Your job "${jobTitle}" is live!`,
    html: wrapTemplate(`
      <h2 style="color:#FF4D00;margin:0 0 15px 0;font-size:20px;">Job Posted!</h2>
      <p style="color:#e5e5e5;line-height:1.6;margin:0 0 15px 0;">
        Hey ${posterName}, your job <strong>"${jobTitle}"</strong> is now live and visible to giggers in your area.
      </p>
      <p style="color:#9ca3af;line-height:1.6;margin:0 0 15px 0;">
        You'll get notified when someone applies. In the meantime, check out other gigs in your area.
      </p>
      <div style="text-align:center;margin:25px 0;">
        <a href="https://nexgigs.com/gigs"
           style="background-color:#FF4D00;color:#ffffff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
          View My Jobs
        </a>
      </div>
    `),
  };
}

export function applicationReceivedEmail(
  posterName: string,
  giggerName: string,
  jobTitle: string,
  bidAmount: number
): { subject: string; html: string } {
  return {
    subject: `New application for "${jobTitle}"`,
    html: wrapTemplate(`
      <h2 style="color:#FF4D00;margin:0 0 15px 0;font-size:20px;">New Application!</h2>
      <p style="color:#e5e5e5;line-height:1.6;margin:0 0 15px 0;">
        Hey ${posterName}, <strong>${giggerName}</strong> applied to your job <strong>"${jobTitle}"</strong>.
      </p>
      <div style="background-color:#1a1a1a;border-radius:8px;padding:15px;margin:15px 0;">
        <p style="color:#9ca3af;margin:0 0 5px 0;font-size:13px;">Their bid:</p>
        <p style="color:#ffffff;font-size:24px;font-weight:900;margin:0;">$${bidAmount}</p>
      </div>
      <div style="text-align:center;margin:25px 0;">
        <a href="https://nexgigs.com/gigs"
           style="background-color:#FF4D00;color:#ffffff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
          Review Application
        </a>
      </div>
    `),
  };
}

export function jobCompletedEmail(
  name: string,
  jobTitle: string,
  amount: number,
  role: "gigger" | "poster"
): { subject: string; html: string } {
  return {
    subject: `Job completed: "${jobTitle}"`,
    html: wrapTemplate(`
      <h2 style="color:#22c55e;margin:0 0 15px 0;font-size:20px;">Job Completed!</h2>
      <p style="color:#e5e5e5;line-height:1.6;margin:0 0 15px 0;">
        Hey ${name}, <strong>"${jobTitle}"</strong> has been marked as complete.
      </p>
      ${
        role === "gigger"
          ? `<div style="background-color:#1a1a1a;border-radius:8px;padding:15px;margin:15px 0;">
              <p style="color:#9ca3af;margin:0 0 5px 0;font-size:13px;">You earned:</p>
              <p style="color:#22c55e;font-size:24px;font-weight:900;margin:0;">$${amount}</p>
            </div>`
          : ""
      }
      <p style="color:#9ca3af;line-height:1.6;margin:0 0 15px 0;">
        Don't forget to leave a rating — it helps the community.
      </p>
      <div style="text-align:center;margin:25px 0;">
        <a href="https://nexgigs.com/gigs"
           style="background-color:#FF4D00;color:#ffffff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
          Leave a Rating
        </a>
      </div>
    `),
  };
}
