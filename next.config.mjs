import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/**
 * Security headers applied to every route.
 *
 * - Content-Security-Policy: deny by default. Allow self + the small set of
 *   third-party origins we actually need (Supabase realtime/storage, Mapbox,
 *   Stripe, Persona, Daily.co, Google fonts, Resend tracking pixels).
 *   We allow `'unsafe-inline'` for scripts because Next.js currently emits
 *   inline bootstrap scripts; tightening to nonce-based CSP is a follow-up.
 *   `frame-ancestors 'none'` blocks clickjacking.
 * - X-Frame-Options: belt-and-braces with frame-ancestors for old browsers.
 * - X-Content-Type-Options: stops MIME-sniffing on user uploads.
 * - Referrer-Policy: don't leak full URLs cross-origin.
 * - Permissions-Policy: drop camera/mic by default; geolocation is needed
 *   for hyperlocal features so it's same-origin only.
 * - Strict-Transport-Security: force HTTPS for 2 years incl. subdomains.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://withpersona.com https://*.daily.co",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' blob: data: https://*.supabase.co https://api.mapbox.com https://*.tiles.mapbox.com https://*.stripe.com",
  "media-src 'self' blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://api.stripe.com https://withpersona.com https://*.daily.co wss://*.daily.co",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://withpersona.com https://*.daily.co",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default pwaConfig(nextConfig);
