/**
 * Checkr API client for background checks.
 * Creates candidates, orders reports, and processes webhooks.
 */

const CHECKR_API_URL = "https://api.checkr.com/v1";

function getAuth() {
  const key = process.env.CHECKR_API_KEY;
  if (!key) throw new Error("CHECKR_API_KEY not configured");
  return Buffer.from(`${key}:`).toString("base64");
}

function getHeaders() {
  return {
    Authorization: `Basic ${getAuth()}`,
    "Content-Type": "application/json",
  };
}

/**
 * Create a Checkr candidate and order a background check.
 * Requires user consent (FCRA compliance).
 */
export async function createBackgroundCheck(input: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}): Promise<{ candidateId: string; invitationUrl: string }> {
  // Step 1: Create candidate
  const candidateRes = await fetch(`${CHECKR_API_URL}/candidates`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      custom_id: input.userId,
    }),
  });

  if (!candidateRes.ok) {
    const error = await candidateRes.text();
    throw new Error(`Checkr API error: ${candidateRes.status} — ${error}`);
  }

  const candidate = await candidateRes.json();
  const candidateId = candidate.id;

  // Step 2: Create invitation (Checkr hosts the consent + data collection flow)
  const inviteRes = await fetch(`${CHECKR_API_URL}/invitations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      candidate_id: candidateId,
      package: "tasker_standard", // Standard gig worker package
    }),
  });

  if (!inviteRes.ok) {
    const error = await inviteRes.text();
    throw new Error(`Checkr invitation error: ${inviteRes.status} — ${error}`);
  }

  const invitation = await inviteRes.json();

  return {
    candidateId,
    invitationUrl: invitation.invitation_url,
  };
}

/**
 * Verify a Checkr webhook signature.
 *
 * Checkr signs webhooks using HMAC-SHA256 of the raw request body
 * with your `CHECKR_WEBHOOK_SECRET`. The hex digest is sent in the
 * `X-Checkr-Signature` header.
 *
 * Reference: https://docs.checkr.com/#tag/Webhooks
 */
export async function verifyCheckrWebhook(
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  const secret = process.env.CHECKR_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const { createHmac, timingSafeEqual } = await import("crypto");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  // Constant-time comparison; bail out on length mismatch first to avoid throw
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Get the status of a background check report.
 */
export async function getCheckrReport(reportId: string): Promise<{
  status: string;
  result: string | null;
  completedAt: string | null;
}> {
  const res = await fetch(`${CHECKR_API_URL}/reports/${reportId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error(`Checkr API error: ${res.status}`);

  const data = await res.json();
  return {
    status: data.status ?? "unknown",
    result: data.result ?? null,
    completedAt: data.completed_at ?? null,
  };
}
