# NexGigs

Hyperlocal gig and task marketplace (TaskRabbit-style), in beta at nexgigs.com. Users are `gigger` (does work) or `poster` (hires); one user can also own businesses with public storefronts. Owned by NexGigs LLC under The Ironwood Company.

## Tech Stack
- **App:** Next.js 14 App Router + TypeScript (strict, `@/*` → `src/*`), Tailwind 3, zod 4, react-hook-form
- **Backend:** Supabase via `@supabase/ssr` (Auth, Postgres, RLS)
- **Payments:** Stripe (Connect Express for giggers, subscriptions, shop checkout), apiVersion `2025-03-31.basil`
- **Other:** Resend (email), Mapbox, web-push + custom service worker, Persona + Checkr (identity/background checks), Anthropic SDK, Discord webhooks
- **Hosting:** Vercel (with crons). Android app is a Bubblewrap TWA in `android-app/` (`com.nexgigs.app`), a webview wrapper with no native code

## Layout
- `src/app/(app)/` authenticated shell (dashboard, jobs, gigs, messages, shop, businesses, storefront, earnings, admin...)
- `src/app/(auth)/`, `src/app/store/[slug]/` (public storefronts), `src/app/api/` (stripe, webhooks, cron, verify, ai, admin)
- `src/lib/actions/` server actions (`"use server"`) with zod schemas in `src/lib/validations/`
- `src/lib/supabase/` clients: `server.ts` (RSC/actions), `client.ts` (browser), `admin.ts` (service role: webhooks and crons only)
- `supabase/migrations/` hand-written, idempotent SQL

## Key Patterns
- All tables prefixed `nexgigs_`; enable RLS on every new table
- Mutations go through server actions + zod, not ad-hoc API routes
- Active identity (personal vs a business) lives in the `nexgigs_active_identity` cookie, set and validated server-side in `src/lib/actions/businesses.ts`; the cookie constant is deliberately not exported
- New businesses start `pending`; a storefront can't publish until an admin approves the business
- Stripe webhook (`api/stripe/webhook`) verifies the signature on the raw body; crons check `CRON_SECRET`
- Brand: orange `#FF4D00` on `#0a0a0a`, Geist fonts (see `tailwind.config.ts`)
- Conventional commits (`fix(navbar): ...`)

## Commands
```bash
npm run dev     # dev server on :3000
npm run build   # production build (next-pwa writes sw.js + workbox into public/)
npm run lint    # next lint
```
No test runner is set up yet.

## Gotchas
- `next.config.mjs` has a strict CSP allowlist: a new third-party origin (script, img, connect, frame) must be added there or the browser blocks it
- `src/lib/rate-limit.ts` is in-memory, so limits don't hold across serverless instances
- `src/lib/ai.ts` hardcodes `claude-sonnet-4-20250514` while its comment says Haiku
- The base schema of `nexgigs_profiles` and `nexgigs_jobs` isn't in the repo; migrations only alter them
- No generated Supabase types; types are hand-written
- The repo is PUBLIC: never commit secrets. Upload-key passwords live in the gitignored `android-app/keystore.properties` (or `NEXGIGS_STORE_PASSWORD` / `NEXGIGS_KEY_PASSWORD` env vars), read by `android-app/app/build.gradle`. `bubblewrap update` regenerates that build.gradle, so re-check its `signingConfigs` afterwards
- The app uses Play App Signing: `assetlinks.json` lists the Play app-signing cert (`EA:BB:…`) and the upload cert; both `public/.well-known/assetlinks.json` and `src/app/.well-known/assetlinks.json/route.ts` must change together

## Environment Variables
See `.env.local.example`. Also needed but missing from it: `ANTHROPIC_API_KEY`, `CRON_SECRET`, `PERSONA_TEMPLATE_ID`, `PERSONA_WEBHOOK_SECRET`, `CHECKR_WEBHOOK_SECRET`.
