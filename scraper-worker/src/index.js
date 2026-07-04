import 'dotenv/config'
import { createAdminClient } from './supabase.js'
import { scrapeAdLibraryForBrand } from './scrape.js'

const DELAY_BETWEEN_BRANDS_MS = 5000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function run() {
  const supabase = createAdminClient()

  const { data: brands, error } = await supabase
    .from('brands')
    .select('id, page_name')

  if (error) {
    console.error('Failed to load brands:', error.message)
    process.exit(1)
  }

  console.log(`Scraper worker: ${brands.length} brand(s) to process`)

  for (const brand of brands) {
    console.log(`Scraping "${brand.page_name}"...`)
    let scrapedAds = []
    try {
      scrapedAds = await scrapeAdLibraryForBrand(brand.page_name)
    } catch (err) {
      console.error(`  failed: ${err.message}`)
      await sleep(DELAY_BETWEEN_BRANDS_MS)
      continue
    }

    console.log(`  found ${scrapedAds.length} ad(s)`)

    if (scrapedAds.length > 0) {
      const rows = scrapedAds.map((ad) => ({
        brand_id: brand.id,
        external_id: ad.externalId,
        headline: ad.headline,
        body_copy: ad.bodyCopy,
        media_url: ad.mediaUrl,
        first_seen: ad.firstSeen,
        last_seen: new Date().toISOString(),
        source: 'scraped',
      }))
      const { error: upsertError } = await supabase.from('ads').upsert(rows, { onConflict: 'external_id' })
      if (upsertError) {
        console.error(`  upsert failed: ${upsertError.message}`)
      }
    }

    await sleep(DELAY_BETWEEN_BRANDS_MS)
  }

  console.log('Done.')
}

run()
