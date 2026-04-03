// Simple in-memory rate limiter for auth endpoints
// For production, replace with Redis-backed solution

const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // 5 attempts per window

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = attempts.get(key);

  // No record or expired window — allow
  if (!record || now > record.resetAt) {
    const resetAt = now + WINDOW_MS;
    attempts.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetAt };
  }

  // Within window — check count
  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  // Increment
  const updated = { count: record.count + 1, resetAt: record.resetAt };
  attempts.set(key, updated);
  return { allowed: true, remaining: MAX_ATTEMPTS - updated.count, resetAt: record.resetAt };
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  attempts.forEach((record, key) => {
    if (now > record.resetAt) {
      attempts.delete(key);
    }
  });
}, 60 * 1000);
