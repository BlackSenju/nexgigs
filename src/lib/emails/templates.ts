/**
 * NexGigs email templates.
 *
 * Each template returns { subject, html } ready to pass to sendEmail().
 * All templates share the base wrapEmail() brand layout.
 */

import { wrapEmail, button, secondaryButton, infoBox, escapeHtml, type EmailTemplate } from "./base";

const BASE_URL = "https://nexgigs.com";

// ────────────────────────────────────────────────────────────────
// PHASE 1: Welcome Email
// ────────────────────────────────────────────────────────────────

/**
 * Sent immediately after a user signs up (email or Google OAuth).
 * Goal: reduce drop-off by giving clear next steps.
 */
export function welcomeEmail(firstName: string): EmailTemplate {
  const name = escapeHtml(firstName);

  return {
    subject: `Welcome to NexGigs, ${name} 👋`,
    preheader: "Here's how to earn your first dollar on NexGigs — takes 60 seconds.",
    html: wrapEmail(
      `
      <h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0 0 12px;">
        Welcome to NexGigs, ${name}! 👋
      </h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 20px;">
        You just joined Milwaukee's hyperlocal gig platform. You can earn money,
        hire local help, or sell in the shop — all in one place.
      </p>

      <div style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:20px;margin:20px 0;">
        <h3 style="color:#FF4D00;font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">
          Get started in 60 seconds
        </h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:32px;padding:8px 12px 8px 0;vertical-align:top;">
              <div style="width:28px;height:28px;background:#FF4D00;color:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-weight:900;font-size:13px;">1</div>
            </td>
            <td style="padding:8px 0;">
              <p style="color:#ffffff;font-size:14px;font-weight:700;margin:0 0 2px;">Build your profile with AI</p>
              <p style="color:#71717a;font-size:12px;margin:0;">Our AI writes your bio and suggests pricing in 60 seconds</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 12px 8px 0;vertical-align:top;">
              <div style="width:28px;height:28px;background:#FF4D00;color:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-weight:900;font-size:13px;">2</div>
            </td>
            <td style="padding:8px 0;">
              <p style="color:#ffffff;font-size:14px;font-weight:700;margin:0 0 2px;">Browse local jobs</p>
              <p style="color:#71717a;font-size:12px;margin:0;">Find gigs near you and apply with a single tap</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 12px 8px 0;vertical-align:top;">
              <div style="width:28px;height:28px;background:#FF4D00;color:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-weight:900;font-size:13px;">3</div>
            </td>
            <td style="padding:8px 0;">
              <p style="color:#ffffff;font-size:14px;font-weight:700;margin:0 0 2px;">Post a job or list something</p>
              <p style="color:#71717a;font-size:12px;margin:0;">Need help or have something to sell? We'll match you fast</p>
            </td>
          </tr>
        </table>
      </div>

      ${button("Build My Profile with AI", `${BASE_URL}/settings/ai-profile`)}
      ${secondaryButton("Go to Dashboard", `${BASE_URL}/dashboard`)}

      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #262626;">
        <p style="color:#71717a;font-size:12px;line-height:1.5;margin:0;">
          <strong style="color:#a1a1aa;">💡 Pro tip:</strong> Complete your profile to get 2x more applications.
          Users with photos and skills get hired 4x faster than those without.
        </p>
      </div>

      <p style="color:#52525b;font-size:12px;margin:20px 0 0;">
        Questions? Just reply to this email — a real human will get back to you.
      </p>
      `,
      {
        preheader: "Here's how to earn your first dollar on NexGigs — takes 60 seconds.",
      }
    ),
  };
}

// ────────────────────────────────────────────────────────────────
// PHASE 2: New Application Alert
// ────────────────────────────────────────────────────────────────

/**
 * Sent to a job poster when someone applies to their job.
 * Goal: poster sees applicants fast → hires fast → commission.
 */
export function newApplicationEmail(input: {
  posterFirstName: string;
  giggerFirstName: string;
  giggerLastInitial: string;
  jobTitle: string;
  bidAmount: number | null;
  jobId: string;
  giggerRating?: number | null;
  giggerGigsCompleted?: number | null;
  giggerCity?: string;
}): EmailTemplate {
  const name = escapeHtml(input.posterFirstName);
  const gigger = escapeHtml(
    `${input.giggerFirstName} ${input.giggerLastInitial}.`
  );
  const jobTitle = escapeHtml(input.jobTitle);
  const rating =
    typeof input.giggerRating === "number" && input.giggerRating > 0
      ? `⭐ ${input.giggerRating.toFixed(1)}`
      : "New gigger";
  const completedGigs = input.giggerGigsCompleted ?? 0;

  return {
    subject: `New bid on "${input.jobTitle}" — $${input.bidAmount ?? "open"} from ${gigger}`,
    preheader: `${gigger} wants to work on your job. Review their profile and hire now.`,
    html: wrapEmail(
      `
      <h1 style="color:#ffffff;font-size:22px;font-weight:900;margin:0 0 12px;">
        🎉 New application!
      </h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hey ${name}, <strong style="color:#ffffff;">${gigger}</strong> just applied
        to your job <strong style="color:#ffffff;">"${jobTitle}"</strong>.
      </p>

      <div style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:20px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:50%;padding:8px 12px 8px 0;">
              <p style="color:#71717a;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Their bid</p>
              <p style="color:#FF4D00;font-size:22px;font-weight:900;margin:0;">
                ${input.bidAmount !== null ? `$${input.bidAmount}` : "Open to discuss"}
              </p>
            </td>
            <td style="width:50%;padding:8px 0;">
              <p style="color:#71717a;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Rating</p>
              <p style="color:#ffffff;font-size:16px;font-weight:700;margin:0 0 4px;">${rating}</p>
              <p style="color:#71717a;font-size:11px;margin:0;">${completedGigs} gig${completedGigs === 1 ? "" : "s"} completed</p>
            </td>
          </tr>
          ${
            input.giggerCity
              ? `<tr><td colspan="2" style="padding:8px 0 0;"><p style="color:#71717a;font-size:12px;margin:0;">📍 ${escapeHtml(input.giggerCity)}</p></td></tr>`
              : ""
          }
        </table>
      </div>

      ${button("Review & Hire", `${BASE_URL}/jobs/${input.jobId}/applicants`)}

      <p style="color:#71717a;font-size:12px;line-height:1.5;margin:20px 0 0;">
        <strong style="color:#a1a1aa;">⚡ Tip:</strong> The faster you respond, the better
        the hire. Top posters respond within 2 hours on average.
      </p>
      `
    ),
  };
}

// ────────────────────────────────────────────────────────────────
// PHASE 2: Message Received (with 2-hour debounce on caller side)
// ────────────────────────────────────────────────────────────────

/**
 * Sent when someone receives a new message (only if they haven't opened
 * the app in the last 2 hours — the caller must check that).
 * Goal: don't let conversations go cold.
 */
export function newMessageEmail(input: {
  recipientFirstName: string;
  senderFirstName: string;
  senderLastInitial: string;
  messagePreview: string;
  conversationId: string;
}): EmailTemplate {
  const name = escapeHtml(input.recipientFirstName);
  const sender = escapeHtml(
    `${input.senderFirstName} ${input.senderLastInitial}.`
  );
  const preview = escapeHtml(
    input.messagePreview.length > 140
      ? input.messagePreview.slice(0, 140) + "..."
      : input.messagePreview
  );

  return {
    subject: `${sender} sent you a message`,
    preheader: input.messagePreview.slice(0, 100),
    html: wrapEmail(
      `
      <h1 style="color:#ffffff;font-size:22px;font-weight:900;margin:0 0 12px;">
        💬 New message
      </h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hey ${name}, <strong style="color:#ffffff;">${sender}</strong> sent you a message on NexGigs.
      </p>

      <div style="background:#0a0a0a;border-left:3px solid #FF4D00;border-radius:6px;padding:16px 20px;margin:20px 0;">
        <p style="color:#e4e4e7;font-size:14px;line-height:1.6;margin:0;font-style:italic;">
          "${preview}"
        </p>
      </div>

      ${button("Reply Now", `${BASE_URL}/messages?conversation=${input.conversationId}`)}

      <p style="color:#71717a;font-size:12px;line-height:1.5;margin:20px 0 0;">
        <strong style="color:#a1a1aa;">⚡ Fast responders get hired more.</strong>
        Reply within an hour to boost your response rate.
      </p>
      `
    ),
  };
}

// ────────────────────────────────────────────────────────────────
// PHASE 2: Job Posted Confirmation (with upsell)
// ────────────────────────────────────────────────────────────────

/**
 * Sent to a poster immediately after they post a job.
 * Goal: confirmation + drive boost upsell + share link.
 */
export function jobPostedEmail(input: {
  posterFirstName: string;
  jobTitle: string;
  jobCategory: string;
  jobId: string;
  price?: number | null;
}): EmailTemplate {
  const name = escapeHtml(input.posterFirstName);
  const jobTitle = escapeHtml(input.jobTitle);
  const category = escapeHtml(input.jobCategory);
  const priceDisplay =
    typeof input.price === "number" && input.price > 0
      ? `$${input.price}`
      : "Open to bids";

  return {
    subject: `Your job is live — we're finding candidates 🚀`,
    preheader: `"${input.jobTitle}" is now visible to giggers in your area.`,
    html: wrapEmail(
      `
      <h1 style="color:#ffffff;font-size:22px;font-weight:900;margin:0 0 12px;">
        ✅ Your job is live!
      </h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hey ${name}, your job <strong style="color:#ffffff;">"${jobTitle}"</strong>
        is now visible to giggers in your area. You'll get a Discord ping and another
        email the moment someone applies.
      </p>

      <div style="background:#0a0a0a;border:1px solid #262626;border-radius:12px;padding:16px 20px;margin:20px 0;">
        <p style="color:#71717a;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Job details</p>
        <p style="color:#ffffff;font-size:16px;font-weight:700;margin:0 0 4px;">${jobTitle}</p>
        <p style="color:#71717a;font-size:13px;margin:0;">${category} • ${priceDisplay}</p>
      </div>

      <h3 style="color:#ffffff;font-size:15px;font-weight:700;margin:24px 0 12px;">
        Get applicants faster:
      </h3>
      <ul style="color:#a1a1aa;font-size:13px;line-height:1.8;margin:0 0 16px;padding-left:20px;">
        <li><strong style="color:#ffffff;">Add photos</strong> — listings with photos get 3x more applications</li>
        <li><strong style="color:#ffffff;">Be specific</strong> — detailed job descriptions attract better giggers</li>
        <li><strong style="color:#ffffff;">Respond fast</strong> — top posters reply within 2 hours</li>
      </ul>

      ${button("View My Job", `${BASE_URL}/jobs/${input.jobId}`)}
      ${secondaryButton("Share Job", `${BASE_URL}/jobs/${input.jobId}`)}

      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #262626;">
        <p style="color:#71717a;font-size:12px;line-height:1.5;margin:0;">
          <strong style="color:#FF4D00;">💡 Want faster results?</strong> Boost this job
          for $2.99 to feature it at the top of the job feed for 24 hours.
        </p>
      </div>
      `
    ),
  };
}

// ────────────────────────────────────────────────────────────────
// PHASE 2: Hired Confirmation (bonus — useful for both parties)
// ────────────────────────────────────────────────────────────────

/**
 * Sent to a gigger when they're hired for a job.
 */
export function hiredEmail(input: {
  giggerFirstName: string;
  jobTitle: string;
  jobId: string;
  posterFirstName: string;
  agreedPrice: number | null;
}): EmailTemplate {
  const name = escapeHtml(input.giggerFirstName);
  const jobTitle = escapeHtml(input.jobTitle);
  const poster = escapeHtml(input.posterFirstName);

  return {
    subject: `🎉 You've been hired for "${input.jobTitle}"!`,
    preheader: `${poster} just picked you. Here's what to do next.`,
    html: wrapEmail(
      `
      <h1 style="color:#22c55e;font-size:24px;font-weight:900;margin:0 0 12px;">
        🎉 You've been hired!
      </h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Congrats ${name}! <strong style="color:#ffffff;">${poster}</strong> hired you for
        <strong style="color:#ffffff;">"${jobTitle}"</strong>.
      </p>

      ${
        input.agreedPrice !== null
          ? infoBox("Agreed price", `$${input.agreedPrice}`, "#22c55e")
          : ""
      }

      <h3 style="color:#ffffff;font-size:15px;font-weight:700;margin:24px 0 12px;">
        What happens next:
      </h3>
      <ol style="color:#a1a1aa;font-size:13px;line-height:1.8;margin:0 0 16px;padding-left:20px;">
        <li>Payment is held in escrow — you're protected</li>
        <li>Message ${poster} to coordinate details</li>
        <li>Complete the work and mark it done</li>
        <li>Payment is released to your account</li>
      </ol>

      ${button("Message the Poster", `${BASE_URL}/messages`)}
      ${secondaryButton("View Job Details", `${BASE_URL}/jobs/${input.jobId}`)}
      `
    ),
  };
}

// ────────────────────────────────────────────────────────────────
// PHASE 2: Daily Job Matches (Phase 3 but including for completeness)
// ────────────────────────────────────────────────────────────────

/**
 * Daily digest of new jobs matching a gigger's skills.
 * Trigger: cron job, once per day at 9am local time, only if there
 * are new matches since their last email.
 */
export function jobMatchesDigestEmail(input: {
  firstName: string;
  matches: Array<{
    id: string;
    title: string;
    category: string;
    city: string;
    distance?: number;
    price?: number | null;
    hourlyRate?: number | null;
  }>;
}): EmailTemplate {
  const name = escapeHtml(input.firstName);
  const count = input.matches.length;

  const matchRows = input.matches
    .slice(0, 5)
    .map((job) => {
      const price =
        job.price != null
          ? `$${job.price}`
          : job.hourlyRate != null
            ? `$${job.hourlyRate}/hr`
            : "Open to bids";
      const distance = job.distance != null ? `${job.distance.toFixed(1)} mi` : job.city;

      return `
      <a href="${BASE_URL}/jobs/${job.id}" style="display:block;text-decoration:none;background:#0a0a0a;border:1px solid #262626;border-radius:10px;padding:16px;margin:8px 0;">
        <p style="color:#ffffff;font-size:15px;font-weight:700;margin:0 0 4px;">${escapeHtml(job.title)}</p>
        <p style="color:#71717a;font-size:12px;margin:0 0 6px;">${escapeHtml(job.category)} • 📍 ${escapeHtml(distance)}</p>
        <p style="color:#FF4D00;font-size:14px;font-weight:700;margin:0;">${escapeHtml(price)}</p>
      </a>`;
    })
    .join("");

  return {
    subject: `🔥 ${count} new ${count === 1 ? "gig matches" : "gigs match"} your skills`,
    preheader: `New jobs in Milwaukee matching what you do. Apply fast — early applications get seen more.`,
    html: wrapEmail(
      `
      <h1 style="color:#ffffff;font-size:22px;font-weight:900;margin:0 0 12px;">
        🔥 ${count} new ${count === 1 ? "gig matches" : "gigs match"} your skills
      </h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Morning ${name}! Here are the freshest jobs in your area matching your skills.
        Early applicants get hired 4x more often.
      </p>

      ${matchRows}

      ${button("See All Jobs", `${BASE_URL}/jobs`)}

      <p style="color:#71717a;font-size:11px;margin:20px 0 0;text-align:center;">
        Not interested? <a href="${BASE_URL}/settings?tab=notifications" style="color:#71717a;text-decoration:underline;">Manage email preferences</a>
      </p>
      `
    ),
  };
}
