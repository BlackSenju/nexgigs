/**
 * Persona API client for identity verification.
 * Uses Persona Hosted Flow — redirect user to Persona-hosted page.
 * Webhook fires back when verification completes.
 */

const PERSONA_API_URL = "https://withpersona.com/api/v1";

function getHeaders() {
  const key = process.env.PERSONA_API_KEY;
  if (!key) throw new Error("PERSONA_API_KEY not configured");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "Persona-Version": "2023-01-05",
    "Key-Inflection": "camel",
  };
}

/**
 * Create a Persona inquiry for a user.
 * Returns the inquiry ID and a session URL to redirect the user to.
 */
export async function createPersonaInquiry(input: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}): Promise<{ inquiryId: string; sessionUrl: string }> {
  const templateId = process.env.PERSONA_TEMPLATE_ID ?? "itmpl_default";

  const res = await fetch(`${PERSONA_API_URL}/inquiries`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      data: {
        attributes: {
          inquiryTemplateId: templateId,
          referenceId: input.userId,
          note: `NexGigs verification for ${input.firstName} ${input.lastName}`,
          fields: {
            nameFirst: { type: "string", value: input.firstName },
            nameLast: { type: "string", value: input.lastName },
            emailAddress: { type: "string", value: input.email },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Persona API error: ${res.status} — ${error}`);
  }

  const data = await res.json();
  const inquiryId = data.data?.id;

  // Build the hosted flow URL
  const sessionUrl = `https://withpersona.com/verify?inquiry-id=${inquiryId}`;

  return { inquiryId, sessionUrl };
}

/**
 * Get the status of an existing inquiry.
 */
export async function getPersonaInquiry(inquiryId: string): Promise<{
  status: string;
  referenceId: string | null;
}> {
  const res = await fetch(`${PERSONA_API_URL}/inquiries/${inquiryId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error(`Persona API error: ${res.status}`);

  const data = await res.json();
  return {
    status: data.data?.attributes?.status ?? "unknown",
    referenceId: data.data?.attributes?.referenceId ?? null,
  };
}

/**
 * Verify a Persona webhook signature.
 *
 * Persona sends the signature header as `t=<unix-seconds>,v1=<hex-hmac>`.
 * The HMAC is SHA-256 of `<timestamp>.<raw-body>` keyed by
 * `PERSONA_WEBHOOK_SECRET`. We compare in constant time.
 *
 * Reference: https://docs.withpersona.com/docs/webhooks#verifying-webhooks
 */
export async function verifyPersonaWebhook(
  payload: string,
  header: string | null
): Promise<boolean> {
  const secret = process.env.PERSONA_WEBHOOK_SECRET;
  if (!secret || !header) return false;

  // Persona's header format:
  //   single sig:  `t=<unix>,v1=<hex>`
  //   during rotation: `t=<unix>,v1=<hex> v1=<hex>` (space-separated)
  // We need to accept ANY matching v1 to support zero-downtime secret rotation.
  let timestamp: string | null = null;
  const v1Sigs: string[] = [];
  for (const segment of header.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)) {
    const [k, v] = segment.split("=", 2);
    if (k === "t" && !timestamp) timestamp = v ?? null;
    if (k === "v1" && v) v1Sigs.push(v);
  }
  if (!timestamp || v1Sigs.length === 0) return false;

  // Reject signatures older than 5 minutes to limit replay window
  const ageSeconds = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300 || ageSeconds < -60) {
    return false;
  }

  const { createHmac, timingSafeEqual } = await import("crypto");
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  const expectedBuf = Buffer.from(expected);

  return v1Sigs.some((sig) => {
    const sigBuf = Buffer.from(sig);
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(expectedBuf, sigBuf);
  });
}
