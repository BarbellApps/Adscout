# AdScout

AI-powered ad creative research & production platform — competitor ad tracking, template library, and AI-assisted ad generation.

Built in the same category as Konvert, Foreplay, PiPiADS, and BigSpy: find proven ad concepts, monitor competitor Meta ad accounts, and generate new ad creative with AI in one workspace.

See [`CLAUDE.md`](./CLAUDE.md) for the full project bible — tech stack, data model, data-sourcing strategy, and build sequence.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase/Stripe/Anthropic keys
npm run dev
```

Run `docs/schema.sql` in the Supabase SQL editor before first use.

## Status

Phase 1 (Foundation) complete: Next.js scaffold, Supabase auth + schema, Stripe plans/gating, dashboard shell with empty states for all six modules (Templates, Scout, Explore, Collections, Canvas, Settings). Scout/Explore data sourcing (Graph API + scraper worker) is Phase 4 — not yet built.
