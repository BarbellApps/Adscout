import { chromium } from 'playwright'

/**
 * @typedef {Object} ScrapedAd
 * @property {string} externalId
 * @property {string|null} headline
 * @property {string|null} bodyCopy
 * @property {string|null} mediaUrl
 * @property {string} firstSeen ISO date
 */

// Meta's public Ad Library page (facebook.com/ads/library) shows every
// currently-active ad for a given page/keyword, regardless of category —
// this is the source every incumbent in this category (Foreplay, PiPiADS,
// BigSpy) actually scrapes, since the official Graph API only covers
// EU-reaching + political/social/housing/employment/credit ads elsewhere.
//
// This function is INTENTIONALLY A STUB. It launches a real browser against
// the real public URL, but does not extract or return any ad data yet.
// Before implementing extraction, you need to:
//   1. Verify Meta's current DOM structure by hand (it changes without
//      notice) and write selectors against it.
//   2. Add residential/rotating proxy support — Meta blocks datacenter IPs
//      and single-IP scraping at any real volume.
//   3. Add rate limiting and backoff between brands/requests.
//   4. Handle infinite-scroll pagination to get more than the first page
//      of results.
//   5. Decide how you want to handle CAPTCHA/interstitial challenges.
//   6. Re-confirm this is still an acceptable approach given Meta's terms
//      of service at the time you deploy this — see CLAUDE.md §3.
export async function scrapeAdLibraryForBrand(pageName) {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(pageName)}&search_type=keyword_unordered`
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    // TODO: extract ad cards from the page. Returning [] keeps the job
    // runner's dedup/upsert logic exercised end-to-end without pretending
    // this scrapes real data yet.
    return /** @type {ScrapedAd[]} */ ([])
  } finally {
    await browser.close()
  }
}
