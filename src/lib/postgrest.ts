/**
 * Shared sanitizers for caller-supplied values that flow into PostgREST
 * filter strings. Without these, an attacker can inject filter operators
 * to escape the intended clause.
 *
 *   - `sanitizeOrSearch` strips characters with special meaning inside an
 *     `or(...)` expression: `(`, `)`, `,`, `:`, `*`, `\`, and `.`. (`.`
 *     is the field/operator separator inside PostgREST grammar.) Length
 *     is also capped to keep the URL bounded.
 *
 *   - `sanitizeIlike` escapes `%` and `_` wildcard characters so a caller
 *     cannot widen a filter into a full table scan.
 */

const OR_FILTER_CONTROL = /[(),:*.\\]/g;

export function sanitizeOrSearch(raw: string, maxLen = 100): string {
  return raw.replace(OR_FILTER_CONTROL, " ").trim().slice(0, maxLen);
}

export function sanitizeIlike(raw: string, maxLen = 100): string {
  // Backslash-escape `%`, `_`, and the escape char itself.
  return raw
    .replace(/\\/g, "\\\\")
    .replace(/[%_]/g, (m) => `\\${m}`)
    .trim()
    .slice(0, maxLen);
}

export function clampLimit(value: unknown, fallback = 50, max = 100): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(value), max);
}
