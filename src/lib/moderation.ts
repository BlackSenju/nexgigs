/**
 * Content moderation and anti-scam rules for NexGigs.
 * Validates job postings, shop items, and messages for prohibited content.
 */

const PROHIBITED_KEYWORDS = [
  // Scam indicators
  "wire transfer", "western union", "money order", "cash only", "venmo me",
  "cashapp me", "zelle me", "pay upfront", "deposit required before",
  "send money first", "advance payment",
  // Illegal services
  "fake id", "counterfeit", "stolen", "illegal", "drugs", "weapons",
  "firearm", "ammunition", "controlled substance",
  // Adult content
  "escort", "adult services", "nsfw",
  // MLM/Pyramid
  "join my team", "downline", "mlm", "pyramid", "network marketing opportunity",
  "be your own boss guaranteed",
];

const SUSPICIOUS_PATTERNS = [
  // Unusually high pay for simple tasks
  { pattern: /\$\d{4,}\s*(per|\/)\s*hour/i, reason: "Unusually high hourly rate" },
  // Contact info in job description (trying to go off-platform)
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, reason: "Phone number detected" },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, reason: "Email address detected" },
  // Urgency manipulation
  { pattern: /act now|limited time|don't miss|urgent.{0,20}reply/i, reason: "Urgency manipulation language" },
  // Zero or suspiciously low pricing
  { pattern: /\$[01]\.?\d{0,2}\s/i, reason: "Suspiciously low price" },
];

export interface ModerationResult {
  approved: boolean;
  warnings: string[];
  blocked: boolean;
  blockReason?: string;
}

/**
 * Check text content for prohibited keywords and suspicious patterns.
 */
export function moderateContent(text: string): ModerationResult {
  const warnings: string[] = [];
  let blocked = false;
  let blockReason: string | undefined;

  const lowerText = text.toLowerCase();

  // Check prohibited keywords
  for (const keyword of PROHIBITED_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      blocked = true;
      blockReason = `Content contains prohibited term: "${keyword}"`;
      break;
    }
  }

  // Check suspicious patterns
  for (const { pattern, reason } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push(reason);
    }
  }

  return {
    approved: !blocked && warnings.length === 0,
    warnings,
    blocked,
    blockReason,
  };
}

/**
 * Validate a job posting for scam indicators.
 */
export function moderateJobPosting(input: {
  title: string;
  description: string;
  price?: number;
  category: string;
}): ModerationResult {
  const combinedText = `${input.title} ${input.description}`;
  const result = moderateContent(combinedText);

  // Category-specific price validation
  const categoryAvgPrices: Record<string, { min: number; max: number }> = {
    "Home & Yard": { min: 20, max: 2000 },
    "Personal Errands": { min: 10, max: 500 },
    "Creative & Digital": { min: 25, max: 5000 },
    "Events": { min: 50, max: 5000 },
    "Food & Cooking": { min: 20, max: 1000 },
    "Tech Help": { min: 25, max: 3000 },
    "Auto & Vehicle": { min: 30, max: 2000 },
    "Hair & Beauty": { min: 15, max: 500 },
    "Fitness & Wellness": { min: 20, max: 500 },
    "Transportation": { min: 15, max: 500 },
    "Tutoring": { min: 15, max: 200 },
    "Trades (Licensed)": { min: 50, max: 10000 },
  };

  if (input.price) {
    const range = categoryAvgPrices[input.category];
    if (range) {
      if (input.price < range.min) {
        result.warnings.push(`Price $${input.price} is below typical range for ${input.category} ($${range.min}-$${range.max})`);
      }
      if (input.price > range.max * 2) {
        result.warnings.push(`Price $${input.price} is unusually high for ${input.category}`);
      }
    }
  }

  // Title length check
  if (input.title.length < 10) {
    result.warnings.push("Job title is very short — add more detail to attract applicants");
  }

  // Description length check
  if (input.description.length < 30) {
    result.warnings.push("Description is very short — detailed descriptions get 2x more applicants");
  }

  return result;
}

/**
 * Validate a shop item listing.
 */
export function moderateShopItem(input: {
  title: string;
  description: string;
  price: number;
}): ModerationResult {
  const combinedText = `${input.title} ${input.description}`;
  const result = moderateContent(combinedText);

  if (input.price <= 0) {
    result.blocked = true;
    result.blockReason = "Price must be greater than $0";
  }

  if (input.price > 10000) {
    result.warnings.push("Price is very high — make sure this is correct");
  }

  return result;
}

/**
 * Validate a message for off-platform communication attempts.
 */
export function moderateMessage(text: string): ModerationResult {
  const result = moderateContent(text);

  // Additional message-specific checks
  const offPlatformPatterns = [
    { pattern: /venmo|cashapp|zelle|paypal/i, reason: "Off-platform payment mention — all payments should go through NexGigs" },
    { pattern: /text me at|call me at|reach me at/i, reason: "Attempting to share contact info — use in-app messaging" },
    { pattern: /instagram|snapchat|telegram|whatsapp|signal/i, reason: "Social media handle detected — communicate through NexGigs" },
  ];

  for (const { pattern, reason } of offPlatformPatterns) {
    if (pattern.test(text)) {
      result.warnings.push(reason);
    }
  }

  // Don't block messages — just warn
  result.blocked = false;

  return result;
}
