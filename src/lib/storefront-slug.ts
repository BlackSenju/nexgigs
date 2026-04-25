/**
 * Storefront slug helpers.
 *
 * Slugs are public-facing URL segments (`nexgigs.com/store/<slug>`). They
 * must:
 *   - be lowercase ASCII alphanumeric + dashes
 *   - 1..40 chars
 *   - not start or end with a dash
 *   - not be in the reserved list (would conflict with app routes or look like spam)
 *
 * The DB also enforces this via a CHECK constraint, but we validate at the
 * app layer so we can return clean error messages instead of a Postgres
 * constraint violation.
 */

export const SLUG_MIN_LEN = 1;
export const SLUG_MAX_LEN = 40;

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

/**
 * Reserved slugs — these would either collide with app routes
 * (`/admin`, `/api`, `/dashboard`, …) or be too generic / brand-confusing
 * to allow as a seller storefront. Keep lowercase.
 */
const RESERVED_SLUGS = new Set<string>([
  // App routes
  "admin", "administrator", "api", "auth", "dashboard", "login", "logout",
  "signup", "signin", "register", "onboarding", "settings", "profile",
  "profiles", "verify", "verification", "support", "help", "contact",
  "about", "legal", "privacy", "terms", "tos", "cookies", "security",
  "jobs", "job", "gigs", "gig", "shop", "store", "stores", "storefront",
  "storefronts", "messages", "message", "notifications", "applications",
  "business", "businesses", "rewards", "checkout", "billing", "payments",
  "payment", "stripe", "webhooks", "webhook", "cron", "tasks",

  // Brand / platform reservations
  "nexgigs", "nex", "gigs", "milwaukee", "mke", "wi", "official",
  "team", "staff", "owner", "founder", "ceo", "moderator", "moderators",
  "claude", "openai", "ai", "anthropic", "supabase", "vercel", "stripe",

  // Anti-impersonation / anti-spam
  "root", "system", "user", "users", "test", "demo", "example", "null",
  "undefined", "anonymous", "guest", "default", "favicon",
  "robots", "sitemap", "feed", "rss", "atom", "_next", "static",
]);

export interface SlugError {
  code:
    | "empty"
    | "too_long"
    | "too_short"
    | "invalid_chars"
    | "leading_dash"
    | "trailing_dash"
    | "reserved";
  message: string;
}

/**
 * Validate a slug. Returns null if valid, or a typed error.
 */
export function validateSlug(raw: string): SlugError | null {
  const slug = String(raw ?? "").trim();
  if (slug.length === 0) {
    return { code: "empty", message: "Slug cannot be empty" };
  }
  if (slug.length < SLUG_MIN_LEN) {
    return { code: "too_short", message: `Slug must be at least ${SLUG_MIN_LEN} character` };
  }
  if (slug.length > SLUG_MAX_LEN) {
    return { code: "too_long", message: `Slug must be ${SLUG_MAX_LEN} characters or fewer` };
  }
  if (slug.startsWith("-")) {
    return { code: "leading_dash", message: "Slug cannot start with a dash" };
  }
  if (slug.endsWith("-")) {
    return { code: "trailing_dash", message: "Slug cannot end with a dash" };
  }
  if (!SLUG_REGEX.test(slug)) {
    return {
      code: "invalid_chars",
      message: "Use only lowercase letters, numbers, and dashes",
    };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { code: "reserved", message: "That URL is reserved — try another one" };
  }
  return null;
}

/**
 * Normalize an arbitrary string into a candidate slug.
 *
 * Steps: lowercase → strip diacritics → keep [a-z0-9 -] → collapse spaces and
 * runs of dashes → trim leading/trailing dashes → enforce max length.
 *
 * Returns "" if the input contains no usable characters; callers should treat
 * an empty string as "needs user input."
 */
export function normalizeSlug(raw: string): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")     // strip combining diacritics
    .replace(/[^a-z0-9\s-]/g, "")        // drop everything that isn't allowed
    .trim()
    .replace(/[\s-]+/g, "-")             // runs of spaces / dashes → single dash
    .replace(/^-+|-+$/g, "")             // trim leading/trailing dashes
    .slice(0, SLUG_MAX_LEN)
    .replace(/-+$/g, "");                // re-trim if slice cut mid-dash
}

/**
 * Suggest the next available slug given a base. Pass an `isTaken` predicate
 * (typically a DB lookup) and we'll return the base if free, or
 * `${base}-2`, `${base}-3`, … up to a sensible cap.
 *
 * Reserved slugs are treated as "taken" automatically.
 */
export async function suggestAvailableSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
  maxAttempts = 50,
): Promise<string | null> {
  const normalized = normalizeSlug(base);
  if (!normalized) return null;

  const trySlug = async (candidate: string): Promise<boolean> => {
    if (validateSlug(candidate) !== null) return false;
    if (await isTaken(candidate)) return false;
    return true;
  };

  if (await trySlug(normalized)) return normalized;

  for (let n = 2; n <= maxAttempts; n++) {
    const suffix = `-${n}`;
    const room = SLUG_MAX_LEN - suffix.length;
    const candidate = `${normalized.slice(0, room).replace(/-+$/, "")}${suffix}`;
    if (await trySlug(candidate)) return candidate;
  }
  return null;
}
