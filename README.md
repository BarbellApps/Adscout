# AdScout

AI-powered ad creative research & production platform — competitor ad tracking, template library, and AI-assisted ad generation.

Built in the same category as Konvert, Foreplay, PiPiADS, and BigSpy: find proven ad concepts, monitor competitor Meta ad accounts, and generate new ad creative with AI in one workspace.

See [`CLAUDE.md`](./CLAUDE.md) for the full project bible — tech stack, data model, data-sourcing strategy, and build sequence.

## Getting started

**Against a real Supabase project:**
```bash
npm install
cp .env.local.example .env.local   # fill in Supabase/Stripe/Anthropic keys
npm run dev
```
Run `docs/schema.sql` in the Supabase SQL editor before first use.

**Local dev with Docker (no cloud project needed):**
```bash
npm install
npx supabase start                 # spins up local Postgres/Auth/Realtime; prints keys
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f docs/schema.sql
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY from the `supabase start` output
npm run dev
```
Stripe/Anthropic/Meta features will fail gracefully with dummy keys — everything else (auth, dashboard, Templates, Scout, Explore, Collections, Canvas UI) works end-to-end this way. This was verified end-to-end with local Supabase + seeded data; see the schema's GRANT section below for one bug that surfaced doing so.

## Status

- **Phase 1 (Foundation)** — complete: Next.js scaffold, Supabase auth + schema, Stripe plans/gating, dashboard shell.
- **Phase 2 (Templates + Collections)** — complete: real Templates/Collections pages, API keys, Chrome extension v1 (`extension/`).
- **Phase 3 (AI Canvas)** — mostly complete: Claude-powered script generation with credit metering and live team notes. Static ad (image) generation and the other model adapters (GPT/Gemini/Grok) aren't wired up yet.
- **Phase 4 (Scout/Explore data sourcing)** — partial: Brands CRUD + official Graph API sync (`/api/scout/sync`, EU + political/social/housing/employment/credit ads) is real and working given a `META_GRAPH_API_ACCESS_TOKEN`. Explore has a basic keyword search over synced/captured ads. The scraper worker (`scraper-worker/`, for broader non-EU commercial ad coverage) is scaffolded but its actual scraping logic is an intentional stub — see its README.
