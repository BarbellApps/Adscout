# CLAUDE.md — AdScout
# Project Bible for Claude Code

---

## 1. PROJECT OVERVIEW

**Product Name:** AdScout
**Type:** B2B SaaS — AI-powered ad creative research & production platform
**Category:** Competes directly with Konvert (usekonvert.com), Foreplay.co, PiPiADS, BigSpy, AdSpy
**Target User:** Performance marketers, ecommerce brands, agencies, designers/editors, dropshippers
**Goal:** Give users a single workspace to find proven ad concepts, monitor competitor ad accounts, and generate new ad creative with AI — replacing manual Meta Ad Library browsing + screenshot dumps in Slack.

This product is an **own-branded** SaaS, not a Konvert reseller/whitelabel — differentiate on execution, pricing, and positioning where sensible, but the feature set below is intentionally close to category leaders since this is an established, proven market.

---

## 2. CORE CONCEPT — SIX MODULES

| Module | What It Does |
|---|---|
| **Templates** | Curated library of high-performing ad templates (target 5,000+, weekly refresh), filterable by industry/format, exportable to Canva/Figma. Curation criteria: 30+ day runtime, from a $10M+ brand, unique concept, or a strong hook/copy angle. |
| **Scout** | 24/7 monitoring of specific competitor brands' Meta ad accounts — hooks, angles, landing pages, audiences, selling points, ad types, scaling vs. testing status. |
| **Explore** | AI-powered search engine across a large indexed pool of live + historical ads, filterable by keyword/niche/format/runtime/platform. |
| **Collections** | Save ads from Scout/Explore/the Chrome extension into shareable team boards. |
| **AI Canvas** | Multi-model AI workspace (Claude + pluggable GPT/Gemini/Grok/image-gen adapters) for ad script generation, static ad variations, and adapting templates to a user's brand. Credit-metered, resets monthly per tier. |
| **Chrome Extension** | One-click capture of any ad seen in-browser into Collections/Canvas. |

---

## 3. DATA SOURCING STRATEGY (read before touching Scout/Explore)

**Decision on record: full scraper stack**, matching how the entire category actually operates.

- Meta's official Graph API (`ads_archive`) only returns political/social-issue/housing/employment/credit ads, plus (per the EU Digital Services Act) **all** ads that reached the EU. It does **not** return an arbitrary US ecommerce competitor's ads.
- Meta's public Ad Library **website** lets anyone search any advertiser Page and browse all of that Page's currently active ads worldwide, without login — this is the actual source Konvert/Foreplay/PiPiADS/BigSpy scrape for "all ads" competitor tracking.
- Scraping that public web UI in an automated way is a **Meta ToS gray area** (publicly viewable data, but automated collection is against their terms; Meta actively rate-limits/blocks scraper traffic). Build this as an isolated, independently-killable service — never let scraper infrastructure or its failure modes touch the core app's reliability or the user's own credentials.

**Architecture implication:**
- Keep the scraper worker fleet as a **separate service** (not in the Next.js app), so it can be rate-limited, proxied, monitored, and — if ever necessary — disabled without taking down the rest of the product.
- Use the official Graph API wherever it legitimately applies (EU-reaching ads, political/social/housing/employment/credit categories globally) as the compliant baseline data source.
- Layer the scraper on top for broader competitor/brand coverage (Scout) and the wider indexed corpus (Explore).
- The Chrome extension's manual single-ad capture (user's own browser session, explicit user action) is a fundamentally different risk profile than bulk scraping — always keep it as a first-class, low-risk data path regardless of what happens with the scraper fleet.

---

## 4. TECH STACK

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js (App Router) | TypeScript strict mode |
| Styling | Tailwind CSS v4 + shadcn/ui | Framer Motion for micro-interactions |
| DB / Auth | Supabase (Postgres + Realtime + Auth) | Realtime powers Canvas team collaboration |
| AI orchestration | Anthropic Claude API (primary) | Adapter layer for OpenAI/GPT, Google/Gemini, xAI/Grok, and an image-gen model for static ad generation |
| Billing | Stripe | Subscriptions + metered Canvas credits |
| Scraper/indexing worker | Separate service (Fly.io/Railway), headless browser automation + rotating proxy pool | Isolated from the main app; own deploy/kill switch |
| Chrome extension | MV3, separate package | Authenticated capture into Collections |
| Design export | Canva Connect API / Figma REST API | "Open in Canva/Figma" |
| Hosting | Vercel (web app) | Worker service hosted separately |
| Email | Resend | Transactional |

---

## 5. DATABASE SCHEMA (sketch — finalize in `docs/schema.sql`)

- `users` — same shape as a standard tiered SaaS user table (subscription_tier, stripe ids, etc.)
- `brands` — tracked competitor pages for Scout (user_id, page_name/id, platform, added_at)
- `ads` — normalized ad record: creative asset refs, copy, hook/angle/CTA tags, first_seen/last_seen, platform, runtime_days, `source` enum (`graph_api` | `manual_capture` | `scraped`)
- `templates` — curated subset of `ads`, tagged industry/format, Canva/Figma doc links
- `collections`, `collection_ads` — join table
- `canvas_projects`, `canvas_generations` — model used, credits spent, output refs
- `credit_ledger` — per-user Canvas credit balance/usage, resets monthly per Stripe tier
- Enable Row Level Security on every table; gate features server-side by `subscription_tier`, never client-only.

---

## 6. SUBSCRIPTION TIERS (reference pricing — adjust before launch)

| Tier | Monthly | Annual (per mo) | Includes |
|---|---|---|---|
| Starter | $49 | $24 | Templates, Explore, Collections, Chrome extension |
| Premium | $79 | $39 | + Scout (10 brands), Canvas (500 credits/mo) |
| Pro | $129 | $69 | + Scout (unlimited brands), Canvas (700 credits/mo) |

No free trial planned initially (satisfaction-guarantee model, matching category norm) — revisit once conversion data exists.

---

## 7. BUILD SEQUENCE

### Phase 1 — Foundation ✅ COMPLETE
- [x] Next.js scaffold, TypeScript strict, Tailwind v4, shadcn/ui
- [x] Supabase schema + RLS + auth (email/password + Google OAuth)
- [x] Stripe tiers + feature gating (server-side)
- [x] Dashboard shell: sidebar/nav, empty states per module

### Phase 2 — Templates + Collections (compliant data only) ✅ COMPLETE
- [x] Templates page — real Supabase query, no fabricated seed data (curation is a manual/editorial task, not automated)
- [ ] Canva/Figma export integration (schema + UI links exist; no OAuth app registered yet)
- [x] Collections CRUD + sharing
- [x] Chrome extension v1 — manual single-ad capture (`extension/`)

### Phase 3 — AI Canvas — mostly complete
- [x] Claude adapter (script/hook generation) — GPT/Gemini/Grok/image-gen adapters not started
- [x] Script/hook generation prompts
- [ ] Static ad variation generation (image model) — needs an image-gen provider + API key
- [x] Credit ledger + Stripe metering (credits reset on checkout/subscription webhook events)
- [x] Realtime team annotation (notes on generations via Supabase Realtime)

### Phase 4 — Scout / Explore (full data expansion) — partial
- [x] Brands CRUD + official Graph API integration (EU + political/social/housing/employment/credit baseline) — `/api/scout/sync`
- [ ] Scraper worker service (`scraper-worker/`) — isolated project scaffolded (job runner, dedup/upsert path, Playwright wired to the real public Ad Library URL); the actual DOM extraction is an intentional stub — see its README for the remaining steps (selectors, proxies, rate limiting, CAPTCHA handling, a fresh ToS check before running for real)
- [ ] Scout dashboard 7-view breakdown (Overview, Hooks, Landing Pages, Angles, Audiences, Selling Points, Ad Types) — currently a flat brand list with ad counts, not the full breakdown
- [x] Explore keyword search over the `ads` table (basic — no niche/format/runtime filters yet)

### Phase 5 — Polish + Launch
- [ ] Billing portal, onboarding flow
- [ ] Error monitoring, mobile responsiveness audit
- [ ] Custom domain, Vercel deploy
- [ ] Beta invite system

---

## 8. CRITICAL RULES FOR CLAUDE CODE

1. TypeScript strict mode — no `any` types.
2. All API calls (including AI, Stripe, scraper-triggered writes) go through server-side routes — never expose API keys client-side.
3. Gate features server-side by subscription tier — never rely on UI-only gating.
4. Supabase RLS enabled on all tables.
5. Every API route returns structured errors.
6. Every async UI action has a loading state — skeletons, not full-page spinners.
7. Mobile-first design.
8. No mock data in production — real API calls or clear empty states.
9. Secrets only in `.env.local` / hosting provider env config, never hardcoded.
10. Stream AI responses where possible to avoid timeouts.
11. **Scraper worker code stays out of the main Next.js app's deploy/runtime path.** It is a separate service with its own repo folder, deploy target, and kill switch.

---

*Seeded from research on usekonvert.com and comparable tools (Foreplay, PiPiADS, BigSpy). See project history for the full research writeup.*
