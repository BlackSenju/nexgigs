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
async function quickAI(systemPrompt: string, userPrompt: string, maxTokens = 1000): Promise<string> {
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
    `You are a job posting consultant for NexGigs marketplace. Analyze the listing and provide actionable tips. Return ONLY valid JSON — no markdown, no backticks. Format: {"suggestions": ["tip1", "tip2", "tip3"], "improvedDescription": "better version or null"}`,
    `Category: ${input.category}
Title: ${input.title}
Description: ${input.description}
${input.price ? `Budget: $${input.price}` : "No budget set"}

Give 3-4 specific, actionable tips to improve this listing. If the description could be better, provide an improved version.`
  );

  try {
    let cleaned = result.trim();
    if (cleaned.startsWith("\`\`\`")) {
      cleaned = cleaned.replace(/^\`\`\`(?:json)?\n?/, "").replace(/\n?\`\`\`$/, "");
    }
    return JSON.parse(cleaned);
  } catch {
    return {
      suggestions: [
        "Add more details about what exactly needs to be done",
        "Include your timeline or deadline",
        "Mention if you provide tools/materials or the gigger needs their own",
        input.price ? "Your budget is set — great! This attracts more applicants." : "Consider adding a budget — jobs with budgets get 3x more applicants",
      ],
    };
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
 * Professional rewrite — transforms a rough description into a polished, professional listing.
 * One-click improvement for both job postings and shop listings.
 */
export async function professionalRewrite(input: {
  title: string;
  description: string;
  category: string;
  type: "job" | "shop";
  price?: number;
}): Promise<{
  rewrittenTitle: string;
  rewrittenDescription: string;
}> {
  const result = await quickAI(
    `You are an expert copywriter. Your ONLY job is to rewrite listings for a gig economy marketplace called NexGigs. You MUST significantly improve the text — never return the same text the user gave you.

CRITICAL RULES:
1. You MUST return ONLY a valid JSON object. No markdown, no backticks, no explanation.
2. The JSON format is: {"rewrittenTitle": "improved title here", "rewrittenDescription": "improved description here"}
3. ALWAYS make the title catchier and more specific
4. ALWAYS expand and improve the description — add structure, clarity, and professionalism
5. Use bullet points with • for requirements or details
6. Fix ALL grammar, spelling, and punctuation
7. Make it sound professional but friendly and approachable
8. Keep the original meaning but make it MUCH better
9. If the description is short, expand it with helpful context
10. NEVER return the original text unchanged`,
    `This is a ${input.type} listing in the "${input.category}" category.
${input.price ? `Budget: $${input.price}` : ""}

ORIGINAL TITLE: ${input.title}

ORIGINAL DESCRIPTION: ${input.description}

Now rewrite BOTH the title and description to be significantly better, more professional, and clearer. Return ONLY the JSON object.`,
    1500
  );

  try {
    // Try to extract JSON from the response (handle markdown wrapping)
    let cleaned = result.trim();
    // Remove markdown code blocks if present
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(cleaned);
    // Verify we actually got different text back
    if (parsed.rewrittenDescription === input.description) {
      // AI returned the same text — force improvement
      return {
        rewrittenTitle: parsed.rewrittenTitle || input.title,
        rewrittenDescription: input.description + "\n\n(AI was unable to improve this description. Try adding more details about what you need done, your timeline, and any specific requirements.)",
      };
    }
    return parsed;
  } catch {
    // JSON parsing failed — try to extract useful text anyway
    const titleMatch = result.match(/"rewrittenTitle"\s*:\s*"([^"]+)"/);
    const descMatch = result.match(/"rewrittenDescription"\s*:\s*"([^"]+)"/);
    if (titleMatch && descMatch) {
      return { rewrittenTitle: titleMatch[1], rewrittenDescription: descMatch[1] };
    }
    // Complete fallback — return a helpful message
    return {
      rewrittenTitle: input.title,
      rewrittenDescription: "AI rewrite failed. Please try again or manually improve your description by adding:\n• What exactly needs to be done\n• Your timeline or deadline\n• Any tools or materials needed\n• Your budget or pay range",
    };
  }
}

/**
 * AI Pricing Suggestion — suggest a price range and package tiers based on what the seller is offering.
 */
export async function suggestPricing(input: {
  title: string;
  description: string;
  category: string;
  listingType: string;
  sessionDuration?: string;
  sessionFormat?: string;
  recurringInterval?: string;
}): Promise<{
  suggestedPrice: number;
  priceRange: { low: number; high: number };
  reasoning: string;
  packages?: {
    basic: { price: number; description: string };
    standard: { price: number; description: string };
    premium: { price: number; description: string };
  };
  tips: string[];
  subscriptionSuggestion?: string;
}> {
  const result = await quickAI(
    `You are a pricing consultant for NexGigs, a hyperlocal gig marketplace in Milwaukee, WI. Help sellers price their listings competitively.

CRITICAL: Return ONLY valid JSON. No markdown, no backticks. Use this exact format:
{
  "suggestedPrice": 50,
  "priceRange": {"low": 30, "high": 80},
  "reasoning": "Brief explanation of why this price works",
  "packages": {
    "basic": {"price": 30, "description": "What basic includes"},
    "standard": {"price": 50, "description": "What standard includes"},
    "premium": {"price": 80, "description": "What premium includes"}
  },
  "tips": ["tip1", "tip2", "tip3"],
  "subscriptionSuggestion": "Optional: suggest if this could be recurring"
}

PRICING GUIDELINES:
- Tutoring: $25-60/hr depending on subject and level
- Personal training: $30-75/session
- Consulting/coaching: $50-150/hr
- Music lessons: $25-50/hr
- Photography: $100-300/session
- Web design: $200-2000/project
- Hair/beauty: $20-150/service
- Lawn care: $30-80/visit
- Handyman: $40-100/hr
- Digital products (templates, guides): $5-50
- Beat packs: $20-100
- Workshops: $25-75/person
- Meal prep: $50-150/week

For services: ALWAYS suggest package tiers and mention if it could work as a subscription.
For digital products: Suggest a single price, lower packages only if bundling makes sense.
For physical products: Price based on materials + labor + margin.`,
    `Listing type: ${input.listingType}
Category: ${input.category}
Title: ${input.title}
Description: ${input.description}
${input.sessionDuration ? `Session duration: ${input.sessionDuration} minutes` : ""}
${input.sessionFormat ? `Format: ${input.sessionFormat}` : ""}
${input.recurringInterval ? `Recurring: ${input.recurringInterval}` : ""}

Suggest competitive pricing for this listing. Include package tiers if it's a service, experience, or subscription. If this service could benefit from being offered as a subscription, mention it.`,
    1500
  );

  try {
    let cleaned = result.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    return JSON.parse(cleaned);
  } catch {
    // Fallback pricing based on listing type
    const defaults: Record<string, number> = {
      digital: 15,
      product: 25,
      service: 50,
      experience: 40,
      subscription: 75,
    };
    const base = defaults[input.listingType] ?? 30;
    return {
      suggestedPrice: base,
      priceRange: { low: Math.round(base * 0.6), high: Math.round(base * 1.6) },
      reasoning: "Based on typical marketplace pricing for this category.",
      packages: {
        basic: { price: Math.round(base * 0.6), description: "Basic package" },
        standard: { price: base, description: "Standard package — most popular" },
        premium: { price: Math.round(base * 1.6), description: "Premium package with extras" },
      },
      tips: [
        "Research what others charge for similar services in your area",
        "Start slightly lower to build reviews, then raise your price",
        "Offering packages increases your average order value by 40%",
      ],
    };
  }
}

/**
 * AI Conversation Assist — suggest professional reply drafts in the messaging system.
 * Elite tier only.
 */
export async function suggestReply(input: {
  conversationContext: string; // last 5-10 messages
  userRole: string; // "gigger" or "poster"
  jobTitle?: string;
}): Promise<{ suggestions: string[] }> {
  const result = await quickAI(
    `You are a professional communication assistant for NexGigs, a gig marketplace. Help the user craft professional, friendly replies.

RULES:
- Generate exactly 3 reply suggestions, from short to detailed
- Keep replies concise, professional, and friendly
- Match the tone of the conversation
- If discussing pricing, be fair but confident
- If scheduling, suggest specific times
- Never be passive-aggressive or overly formal
- Use natural language, not corporate-speak
- Return ONLY valid JSON: {"suggestions": ["reply1", "reply2", "reply3"]}`,
    `Conversation context (most recent messages):
${input.conversationContext}

The user is the ${input.userRole}.
${input.jobTitle ? `This is about the job: "${input.jobTitle}"` : ""}

Generate 3 professional reply suggestions.`,
    800
  );

  try {
    let cleaned = result.trim();
    if (cleaned.startsWith("\`\`\`")) {
      cleaned = cleaned.replace(/^\`\`\`(?:json)?\n?/, "").replace(/\n?\`\`\`$/, "");
    }
    return JSON.parse(cleaned);
  } catch {
    return {
      suggestions: [
        "Thanks for reaching out! I'd be happy to discuss this further.",
        "That sounds great. When would be a good time to connect?",
        "I appreciate the offer. Let me review and get back to you shortly.",
      ],
    };
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
