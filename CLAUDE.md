# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**AdScout** — a B2B SaaS ad-creative-intelligence platform in the same category as Konvert, Foreplay.co, PiPiADS, and BigSpy. It gives performance marketers, ecommerce brands, and agencies one workspace to track competitor ads, browse an ad-template library, search a corpus of live/historical ads, and generate new creative with AI.

Six product modules: **Templates**, **Scout** (competitor Meta-ad tracking), **Explore** (ad search), **Collections** (saveable boards), **AI Canvas** (credit-metered AI script generation), and a **Chrome Extension** (manual ad capture).

## Commands

```bash
npm run dev      # Next.js dev server (Turbopack)
npm run build    # production build — always run before committing non-trivial changes
npm run lint     # eslint (flat config, eslint-config-next). Zero-tolerance: CI/build treats lint errors as blocking
```

There is **no test suite**. Verification is done by `npm run build` + `npm run lint` + real end-to-end checks against the live Supabase/Vercel deployment (see "Verifying against production" below).

Database changes are applied by running SQL: `docs/schema.sql` is the canonical full schema (run in the Supabase SQL editor on a fresh project); incremental changes live in `docs/migrations/NNN_*.sql` and are idempotent (`ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS`). When you change the schema, update **both** the migration file and `docs/schema.sql`, and the `Ad`/`User`/etc. interfaces in `types/index.ts`.

## Next.js is unusual here

**Read `AGENTS.md`.** This project pins a Next.js version whose App-Router APIs may differ from training data (e.g. `params` is a `Promise` you must `await` in route handlers and pages). Before writing routing/rendering code, check the bundled docs in `node_modules/next/dist/docs/` rather than assuming. The `middleware` file convention is deprecated in favor of `proxy` (build warns about it).

## Architecture

### Supabase client trichotomy (this matters constantly)

There are **three** ways to talk to Supabase, and picking the wrong one is a recurring bug source:

- `lib/supabase/server.ts` — cookie-scoped client for the logged-in user. Subject to RLS. Use in server components and most API routes for reads/writes the user is allowed to do.
- `lib/supabase/client.ts` — browser client for client components (auth, realtime subscriptions).
- `lib/supabase/admin.ts` (`createAdminClient`) — **service-role** client that bypasses RLS. Use only server-side, only for privileged writes the user's own role is (deliberately) not granted: Stripe webhook subscription updates, Canvas credit deduction, admin operations, and Scout ad-enrichment writes.

The `users` table is **locked down** (migration `001`): RLS allows a user to SELECT only their own row, and `authenticated` has **no INSERT/UPDATE/DELETE grant** on it. This closes a privilege-escalation hole (a `FOR ALL` policy previously let users PATCH their own `subscription_tier`/`is_admin`). Consequence: any write to `users` — including credit deduction — must go through `createAdminClient()`. RLS alone is not enough to expose a table through PostgREST; explicit `GRANT`s are also required (see the GRANTS block in `docs/schema.sql` — a whole class of "table unreachable" bugs came from missing grants).

### Admin surface

`lib/admin.ts` `getAdminContext()` is the gate: it reads the caller's own `is_admin` flag (allowed by RLS) and, only if true, returns a service-role client. **Every** `/api/admin/*` route and the `/admin` page must call this and bail on `null` before touching other users' data. `is_admin` is bootstrapped via migration `001`; the middleware (`lib/supabase/middleware.ts`) protects `/admin` alongside the other dashboard routes.

### Meta Graph API integration (`lib/meta/graph-api.ts`) — read before touching Scout

This is the subtlest part of the codebase, and several shipped bugs originated here:

- **We use the official `ads_archive` endpoint only.** It reliably returns (a) all EU-reaching ads (per the DSA), regardless of category, and (b) political/social/housing/employment/credit ads globally. For a typical EU DTC/ecommerce competitor this is enough; `DEFAULT_AD_REACHED_COUNTRIES` targets EU markets so a sync returns results.
- **Sync scopes strictly by `search_page_ids` (a real numeric Page ID), never `search_terms`.** `search_terms` is a broad keyword search across the *entire* ad library and returns unrelated advertisers — syncing on it attributed a French romance-novel app's ads to a Dutch bag brand. There is intentionally **no keyword fallback** in the sync path.
- **`search_terms` *is* used, but only for autocomplete** (`searchAdvertiserPages`): it surfaces distinct `(page_id, page_name)` candidates for a human to pick from — powering the "Track a brand" type-ahead — never to sync directly.
- **Page-ID validation goes through `ads_archive`, not the `/{page-id}` node.** The generic page node requires `pages_read_engagement`/Page-Public-Content-Access, which our token does **not** have (it 403s even on valid IDs). `isValidPageId` instead calls `search_page_ids` and treats Meta's specific "Invalid Page ID" subcode (`2334021`) as the only real-negative.
- Rich DSA fields (`eu_total_reach`, `target_ages/gender/locations`, `languages`, `age_country_gender_reach_breakdown`, landing-page captions) are pulled and stored per ad — these power Scout's real analytics. **Meta's public API does not expose spend or engagement rate for regular commercial ads**; do not fabricate them. Competitors model/estimate those; we deliberately show only real data.
- `ad_snapshot_url` embeds our access token in the URL. It must never appear in page HTML. External "view on Meta" links use the public `facebook.com/ads/library/?id={external_id}` form; the tokened URL only flows through the authenticated redirect at `/api/ads/[id]/preview`. Note: Meta serves `X-Frame-Options: DENY` on that render page, so it cannot be iframed — true in-card creative thumbnails require a headless-browser capture worker (see below).

### AI (Anthropic) usage

`lib/anthropic/client.ts` exposes a lazy singleton (`getAnthropicClient()`) so a missing key never breaks build-time, and `CANVAS_TEXT_MODEL` (`claude-sonnet-5`). Two AI surfaces:
- **Canvas** (`lib/canvas.ts`, `lib/anthropic/prompts/canvas.ts`, `/api/canvas/generate`) — credit-metered user-facing script generation.
- **Scout enrichment** (`lib/anthropic/enrich.ts`) — during a sync, one batched Claude call extracts hook/angle/CTA from real ad copy into the otherwise-empty `hook`/`angle`/`cta` columns. It is failure-safe (returns `[]` on any error) so enrichment never breaks a sync, and writes via the admin client.

### Lazy-singleton pattern for external clients

Stripe (`lib/stripe/client.ts`) and Anthropic both use a lazy-getter singleton rather than instantiating at module load. This is deliberate: eager instantiation with an unset key breaks `next build`. Follow this pattern for any new SDK client.

### Feature gating

`lib/utils/gates.ts` `TIER_LIMITS` is the single source of truth for what each tier (`free`/`starter`/`premium`/`pro`) can do and its Canvas-credit allowance. Gate **at the API-route level**, not just UI. `lib/stripe/plans.ts` holds the Stripe price IDs and marketing copy per tier; the webhook (`/api/stripe/webhook`) syncs `subscription_tier`/`status` and resets Canvas credits on subscription events (via the admin client).

### Scraper worker (`scraper-worker/`)

A **separate** Node project with its own `package.json`, deliberately isolated from the Next.js app so it can be rate-limited/proxied/killed without touching core-app reliability. Its DOM extraction is an intentional stub. Scraping Meta's public web UI is a ToS gray area; keep this code out of the main app's deploy/runtime path. The Chrome extension's single-ad manual capture (`/api/extension/capture`, API-key auth) is a different, low-risk data path and stays first-class regardless.

## Design system

Light theme, Stripe-inspired. Tokens live in `app/globals.css` (`:root` custom properties + a `@theme inline` block that maps them to Tailwind v4 utilities — the mapping is required for shadcn primitives to work). Key values: background `#F7F8FA`, primary `#635BFF` (hover `#5147E5`), dark sidebar `#08111F`. Font is Geist Sans. The sidebar is a fixed 220px rail (`components/layout/Sidebar.tsx`); layout offsets in `app/(dashboard)/layout.tsx` depend on that width.

## Verifying against production

The app is deployed to Vercel (`adscout-alpha.vercel.app`) against a real Supabase project. Because there are no automated tests, non-trivial changes are verified end-to-end: build + lint, then drive the real flow (often via Playwright with an injected `@supabase/ssr`-format session cookie, since Chromium in the sandbox can't complete the login form through the proxy). Schema/data fixes are applied to production directly via the Supabase Management API (`api.supabase.com/v1/projects/{ref}/database/query`) — raw Postgres TCP is not reachable through the sandbox proxy. Deploys use the pinned `vercel@54.20.1` CLI.

## Non-obvious constraints

- **Don't fabricate data to match a mockup.** Repeatedly load-bearing in this project: if the official API can't back a widget (spend, engagement rate, audience estimates for non-EU ads), build only what's real and omit the rest rather than inventing plausible numbers. Misattributed/fake data is treated as worse than a missing feature.
- Secrets (`.env.local`) are gitignored and hold real production keys — never commit them, never print service-role keys or tokens to visible output.
- The Meta user access token is long-lived but expires (~60 days) with no refresh mechanism; it must be re-minted via Graph API Explorer and updated in Vercel env when it lapses.
