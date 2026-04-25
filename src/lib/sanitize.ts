import sanitizeHtml from "sanitize-html";

/**
 * Sanitize the storefront `about_html` field on render.
 *
 * The owner can write rich text, but we strictly allowlist tags + attrs to
 * prevent stored XSS. Server actions already strip <script> on save; this is
 * the second layer of defense applied right before `dangerouslySetInnerHTML`.
 */
export function sanitizeAboutHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "blockquote",
      "ul", "ol", "li", "h2", "h3", "h4", "a", "code", "hr",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    // Only http/https/mailto/tel; refuses javascript:, data:, etc.
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      // Force safe rel + target on every <a>
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      }),
    },
  });
}
