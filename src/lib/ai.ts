import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY not configured");
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}

/**
 * Run a quick AI task using Haiku (cheapest, fastest model).
 * Used for moderation, matching, suggestions — not deep reasoning.
 */
async function quickAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

/**
 * AI Job Matching — find the best jobs for a gigger based on their skills and location.
 */
export async function matchJobsForUser(input: {
  skills: string[];
  city: string;
  state: string;
  pastCategories: string[];
}): Promise<string[]> {
  if (input.skills.length === 0) return [];

  const result = await quickAI(
    "You are a job matching engine for NexGigs, a hyperlocal gig marketplace. Return ONLY a JSON array of category names that best match the user's skills. No explanation, just the JSON array.",
    `User skills: ${input.skills.join(", ")}
City: ${input.city}, ${input.state}
Past work categories: ${input.pastCategories.join(", ") || "none"}

Available categories: Home & Yard, Personal Errands, Creative & Digital, Events, Food & Cooking, Tech Help, Auto & Vehicle, Hair & Beauty, Fitness & Wellness, Transportation, Tutoring, Trades (Licensed)

Return the top 3-5 matching categories as a JSON array.`
  );

  try {
    return JSON.parse(result);
  } catch {
    return [];
  }
}

/**
 * Smart Job Description — suggest improvements to a job posting.
 */
export async function improveJobDescription(input: {
  title: string;
  description: string;
  category: string;
  price?: number;
}): Promise<{
  suggestions: string[];
  improvedDescription?: string;
}> {
  const result = await quickAI(
    `You are a job posting assistant for NexGigs, a gig economy marketplace. Help posters write better job descriptions that attract more applicants. Return JSON only with this format: {"suggestions": ["tip1", "tip2"], "improvedDescription": "better version if needed"}`,
    `Category: ${input.category}
Title: ${input.title}
Description: ${input.description}
${input.price ? `Budget: $${input.price}` : "No budget set"}

Analyze this job posting and return JSON with:
1. "suggestions" — 2-4 quick tips to improve the listing
2. "improvedDescription" — only if the description is unclear or too short, otherwise null`
  );

  try {
    return JSON.parse(result);
  } catch {
    return { suggestions: [] };
  }
}

/**
 * AI Content Moderation — analyze content for policy violations.
 * Returns a safety score and any flagged issues.
 */
export async function aiModerateContent(input: {
  content: string;
  contentType: "job" | "message" | "shop_item" | "review";
}): Promise<{
  safe: boolean;
  score: number;
  issues: string[];
}> {
  const result = await quickAI(
    `You are a content moderator for NexGigs, a gig economy marketplace. Analyze content for safety. Return ONLY JSON: {"safe": true/false, "score": 0-100 (100=completely safe), "issues": ["issue1"]}

Flag: scams, illegal activity, discrimination, harassment, off-platform payment requests, fake listings, adult content, personal info sharing (phone/email in messages).
Do NOT flag: normal job descriptions, pricing discussions, professional services.`,
    `Content type: ${input.contentType}
Content: "${input.content}"

Rate this content's safety and flag any issues.`
  );

  try {
    return JSON.parse(result);
  } catch {
    return { safe: true, score: 80, issues: [] };
  }
}

/**
 * AI Digital Product Review — check if a shop item is legitimate.
 */
export async function reviewDigitalProduct(input: {
  title: string;
  description: string;
  price: number;
  category: string;
}): Promise<{
  approved: boolean;
  concerns: string[];
  priceFeedback?: string;
}> {
  const result = await quickAI(
    `You are a product reviewer for NexGigs marketplace. Review digital product listings for legitimacy. Return JSON only: {"approved": true/false, "concerns": ["concern1"], "priceFeedback": "optional pricing advice"}

Reject: pirated content, resold free resources, copyright violations, misleading descriptions, impossible claims.
Approve: original work, templates, guides, educational content, creative work, digital art.`,
    `Title: ${input.title}
Description: ${input.description}
Price: $${input.price}
Category: ${input.category}

Is this a legitimate product listing?`
  );

  try {
    return JSON.parse(result);
  } catch {
    return { approved: true, concerns: [] };
  }
}

/**
 * Generate a personalized weekly digest for a user.
 */
export async function generateWeeklyDigest(input: {
  userName: string;
  city: string;
  skills: string[];
  recentJobs: Array<{ title: string; category: string; price: number }>;
  stats: { gigsCompleted: number; earned: number; xp: number };
}): Promise<string> {
  return await quickAI(
    `You are writing a friendly weekly email digest for NexGigs. Keep it short, encouraging, and actionable. Use the user's name. Highlight relevant jobs near them. Include their stats. End with a motivating call-to-action. Format as HTML for email. Keep it under 200 words.`,
    `User: ${input.userName}
City: ${input.city}
Skills: ${input.skills.join(", ") || "not set yet"}
Recent jobs in their area:
${input.recentJobs.map((j) => `- ${j.title} (${j.category}) $${j.price}`).join("\n") || "No new jobs this week"}
Stats: ${input.stats.gigsCompleted} gigs done, $${input.stats.earned} earned, ${input.stats.xp} XP

Write a personalized weekly digest email.`
  );
}
