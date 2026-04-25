import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

/**
 * AI helpers scoped to the Storefront feature.
 *
 * We mirror the existing `quickAI()` pattern from src/lib/ai.ts (same
 * Anthropic SDK, same JSON-recovery shape) but expose Storefront-specific
 * functions so the prompts and validators stay close to where they're used.
 */

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY not configured");
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2500,
): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

/** Strip markdown code fences before JSON.parse. */
function unwrapJson(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// ---------- Schemas ----------

const StorefrontIndustryEnum = z.enum([
  "service",
  "clothing",
  "food",
  "coaching",
  "maker",
  "events",
  "wellness",
  "tech",
  "other",
]);

const ListingTypeEnum = z.enum([
  "product",
  "digital",
  "service",
  "experience",
  "subscription",
]);

const HEX_RE = /^#[0-9a-f]{6}$/i;

export const StorefrontDraftSchema = z.object({
  business_name: z.string().min(1).max(60),
  tagline: z.string().min(1).max(180),
  about_html: z.string().min(20).max(2000),
  industry: StorefrontIndustryEnum,
  brand_color: z.string().regex(HEX_RE),
  accent_color: z.string().regex(HEX_RE).optional().nullable(),
  suggested_packages: z
    .array(
      z.object({
        title: z.string().min(1).max(80),
        price: z.number().positive().max(50000),
        description: z.string().min(1).max(400),
        listing_type: ListingTypeEnum,
        recurring_interval: z.string().nullable().optional(),
      }),
    )
    .min(1)
    .max(5),
  how_it_works: z
    .array(
      z.object({
        step: z.number().int().min(1).max(8),
        title: z.string().min(1).max(60),
        body: z.string().min(1).max(220),
      }),
    )
    .min(3)
    .max(5),
  faqs: z
    .array(
      z.object({
        q: z.string().min(1).max(160),
        a: z.string().min(1).max(800),
      }),
    )
    .min(3)
    .max(6),
  service_areas: z.array(z.string().min(1).max(60)).max(8),
});

export type StorefrontDraft = z.infer<typeof StorefrontDraftSchema>;

// ---------- generateStorefrontDraft ----------

export interface GenerateDraftInput {
  oneLineDescription: string;
  city: string;
  state: string;
  voice?: "friendly" | "professional" | "playful" | "bold";
  similarListings?: Array<{
    title: string;
    price: number;
    description: string | null;
  }>;
}

const SYSTEM_DRAFT = `You are a small-business consultant for sellers on NexGigs, a hyperlocal marketplace based in Milwaukee, Wisconsin. Your job is to take a one-sentence description from a business owner and produce a complete, polished storefront draft they can publish in minutes.

Your output is consumed directly by software, so you MUST return ONLY a single valid JSON object — no markdown fences, no commentary, no trailing text.

Output JSON shape:
{
  "business_name": string (1..60 chars; what to call the business — keep it real and human),
  "tagline": string (1..180 chars; one punchy sentence that reads naturally — no marketing gibberish),
  "about_html": string (one to three short <p> tags totalling ~120-200 words; tells the customer what the business does, who it serves, and why to trust them; use plain HTML, no scripts, no inline styles),
  "industry": one of "service" | "clothing" | "food" | "coaching" | "maker" | "events" | "wellness" | "tech" | "other",
  "brand_color": "#RRGGBB" (a hex color appropriate for the industry — e.g. forest green for nature/yard work, warm orange for food, deep blue for tech, soft pink for wellness),
  "accent_color": "#RRGGBB" (a complementary or neutral hex — usually a near-black or warm cream),
  "suggested_packages": array of 2-4 offerings — { title, price (USD), description, listing_type ("product"|"digital"|"service"|"experience"|"subscription"), recurring_interval ("weekly"|"biweekly"|"monthly"|null) }. Anchor pricing to similar-listings input if provided. For service businesses, propose tiers (e.g. one-time, weekly subscription, premium). For product businesses, propose a few price points / bundles.
  "how_it_works": array of 3-4 steps — { step (1-indexed), title (2-4 words), body (one sentence, ~15-25 words) },
  "faqs": array of 3-5 Q/A pairs — { q (real customer question), a (clear, brief answer) },
  "service_areas": array of 0-6 nearby Milwaukee neighborhoods or suburbs the business likely serves (e.g. "Oak Creek","Bay View","Wauwatosa","South Milwaukee"). For online-only businesses return [].
}

Voice rules: write in the requested tone. "friendly" = warm + first-person plural ("we"). "professional" = third-person, polished. "playful" = a little witty, never silly. "bold" = direct, no hedging. Default to "friendly".

Tone rules: no LinkedIn-speak. No "leverage", "synergize", "in today's fast-paced world". Use specific, concrete details over vague claims. If unsure, mention real Milwaukee context (winters, neighborhoods, the local audience).

Pricing rules: If similar-listings input is provided, anchor your prices within ±20% of the median. Never propose a price under $5 or over $50,000.

Stay grounded — invent only what you must. If the seller's one-line description doesn't tell you their hours, business name, or location, propose reasonable defaults the owner can edit. Make it easy for them to say "yes" to your suggestions.`;

export async function generateStorefrontDraft(
  input: GenerateDraftInput,
): Promise<StorefrontDraft> {
  const voice = input.voice ?? "friendly";
  const similarBlock =
    input.similarListings && input.similarListings.length > 0
      ? `\n\nSimilar nearby listings (for pricing anchor):\n${JSON.stringify(
          input.similarListings.slice(0, 8),
        )}`
      : "";

  const userPrompt = `Owner's one-line description: "${input.oneLineDescription}"
Location: ${input.city}, ${input.state}
Voice: ${voice}${similarBlock}

Produce the storefront draft JSON now.`;

  const raw = await callClaude(SYSTEM_DRAFT, userPrompt, 2500);
  const cleaned = unwrapJson(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }
  return StorefrontDraftSchema.parse(parsed);
}

// ---------- improveStorefrontField ----------

export type ImprovableField = "tagline" | "about_html" | "package_description" | "faq_answer";

const SYSTEM_IMPROVE = `You are a copy editor for a small business owner's storefront page on NexGigs (Milwaukee). The owner has written a draft of one specific field; rewrite it so it's clearer, shorter where bloated, more specific where vague, and natural. Keep the owner's voice — never make it more corporate.

Return ONLY a single valid JSON object: { "improved": string }.

Hard rules:
- No HTML in tagline / package_description / faq_answer (plain text only).
- about_html may include <p>, <strong>, <em>, <ul>, <ol>, <li>, <h2>, <h3>, <a href="https?://..."> only.
- Never add fake quotes, fake testimonials, fake stats, or facts the owner didn't provide.
- Stay close to the owner's intent. If they wrote "we clean up dog poop", don't sanitize to "we provide pet sanitation services" — keep the directness.
- Length caps: tagline ≤ 180 chars, faq_answer ≤ 800 chars, about_html ≤ 2000 chars, package_description ≤ 400 chars.`;

export interface ImproveFieldInput {
  field: ImprovableField;
  current: string;
  context?: {
    business_name?: string;
    industry?: string;
  };
}

const ImproveResultSchema = z.object({
  improved: z.string().min(1).max(2200),
});

export async function improveStorefrontField(
  input: ImproveFieldInput,
): Promise<{ improved: string }> {
  if (!input.current || !input.current.trim()) {
    throw new Error("Nothing to improve — the field is empty.");
  }

  const ctx = input.context ?? {};
  const userPrompt = `Field: ${input.field}
Business: ${ctx.business_name ?? "(unspecified)"}
Industry: ${ctx.industry ?? "(unspecified)"}

Current text:
"""
${input.current.slice(0, 3000)}
"""

Return improved JSON.`;

  const raw = await callClaude(SYSTEM_IMPROVE, userPrompt, 1200);
  const cleaned = unwrapJson(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }
  return ImproveResultSchema.parse(parsed);
}
