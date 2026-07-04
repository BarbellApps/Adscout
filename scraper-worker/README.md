# AdScout Scraper Worker

Broader Meta ad competitor coverage than the official Graph API can provide (see `CLAUDE.md` §3 in the main app for why). This is a **separate Node project, deliberately not part of the Next.js app** — its own `package.json`, its own deploy target (Fly.io/Railway, per the plan), its own on/off switch. If it ever needs to be disabled, killed, or rate-limited independently of the main product, that should be a one-line operation, not a code change.

## Status: scaffold only

`src/scrape.js`'s `scrapeAdLibraryForBrand()` launches a real Playwright browser against Meta's real public Ad Library URL, but **does not extract any ad data yet** — it returns an empty array. The job runner (`src/index.js`) reads tracked brands from Supabase and would upsert scraped ads into the `ads` table (`source: 'scraped'`), so the dedup/upsert path is real and exercised, but there is currently nothing to scrape.

Turning this into something that actually works requires, in order:

1. **Verify Meta's current DOM** by hand — it changes without notice, so hardcoded selectors go stale.
2. **Residential/rotating proxies** — Meta blocks datacenter IPs and single-IP scraping at any real volume.
3. **Rate limiting and backoff**, tuned to avoid triggering blocks.
4. **Pagination handling** for the infinite-scroll results list.
5. **CAPTCHA/interstitial handling** — decide how (or whether) to work around these.
6. **A fresh compliance check** against Meta's terms of service at the time you deploy this — the earlier research flagged this as a ToS gray area even though the underlying data is publicly viewable. That risk assessment doesn't get less important just because the code exists.

## Running it

```bash
cd scraper-worker
npm install
npx playwright install chromium
cp .env.example .env   # fill in Supabase URL + service role key
npm start
```

With today's stub, this will run end-to-end (browser launches, page loads, loop completes) and log `found 0 ad(s)` for every brand — that's expected until step 1 above is done.
