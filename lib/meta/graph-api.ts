const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'

// Meta's ads_archive endpoint only reliably covers: (a) ads that reached
// the EU, per the DSA transparency requirement, regardless of category, and
// (b) political/social-issue/housing/employment/credit ads everywhere else.
// It will NOT return an arbitrary non-EU ecommerce competitor's ads — see
// CLAUDE.md §3. Default to EU countries so a sync actually returns results
// for a typical DTC/ecommerce brand.
export const DEFAULT_AD_REACHED_COUNTRIES = ['NL', 'DE', 'FR', 'IT', 'ES']

// Meta's "Invalid Page ID" error for search_page_ids — a stale, mistyped, or
// wrong-object ID. Distinct from other 400s (bad token, malformed request).
const INVALID_PAGE_ID_SUBCODE = 2334021

export interface AdsArchiveEntry {
  id: string
  page_id?: string
  page_name?: string
  ad_creative_bodies?: string[]
  ad_creative_link_titles?: string[]
  ad_creative_link_captions?: string[]
  ad_delivery_start_time?: string
  ad_delivery_stop_time?: string
  ad_snapshot_url?: string
  publisher_platforms?: string[]
}

interface AdsArchiveResponse {
  data: AdsArchiveEntry[]
  paging?: { cursors?: { after?: string }; next?: string }
}

interface AdsArchiveErrorBody {
  error?: { error_subcode?: number; message?: string }
}

function baseParams(accessToken: string, countries?: string[]) {
  return {
    access_token: accessToken,
    ad_type: 'ALL',
    ad_reached_countries: JSON.stringify(countries ?? DEFAULT_AD_REACHED_COUNTRIES),
  }
}

// Deliberately scoped to search_page_ids only. Meta's search_terms does a
// broad keyword match across the *entire* ad library, not a filter on one
// page — for "MAEVA BELLE" it also returned a French romance-novel app.
// Misattributed ad data is worse than a sync that requires a real Page ID,
// so there is no keyword-search fallback in the sync path itself (see
// searchAdvertiserPages below for where keyword search is legitimately used).
export async function searchAdsArchive(params: {
  pageId: string
  countries?: string[]
}): Promise<AdsArchiveEntry[]> {
  const accessToken = process.env.META_GRAPH_API_ACCESS_TOKEN!

  const query = new URLSearchParams({
    ...baseParams(accessToken, params.countries),
    search_page_ids: JSON.stringify([params.pageId]),
    fields: [
      'id',
      'page_name',
      'ad_creative_bodies',
      'ad_creative_link_titles',
      'ad_creative_link_captions',
      'ad_delivery_start_time',
      'ad_delivery_stop_time',
      'ad_snapshot_url',
      'publisher_platforms',
    ].join(','),
  })

  const res = await fetch(`${GRAPH_API_BASE}/ads_archive?${query.toString()}`)

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Meta Graph API error (${res.status}): ${body}`)
  }

  const json = (await res.json()) as AdsArchiveResponse
  return json.data ?? []
}

export interface AdvertiserPage {
  page_id: string
  page_name: string
  ad_count: number
}

// Autocomplete for "which business did you mean" — the same underlying
// keyword search that's unsafe to sync from directly, used instead purely
// to surface distinct (page_id, page_name) candidates for a human to pick
// from, exactly like Meta's own Ad Library search UI. Our token can't call
// the generic pages/search endpoint (needs Page Public Content Access, which
// this app doesn't have), but ads_archive already returns page_id per ad —
// so this needs no extra permission.
export async function searchAdvertiserPages(query: string): Promise<AdvertiserPage[]> {
  const accessToken = process.env.META_GRAPH_API_ACCESS_TOKEN!

  const params = new URLSearchParams({
    ...baseParams(accessToken),
    search_terms: query,
    fields: 'page_id,page_name',
  })
  params.set('limit', '50')

  const res = await fetch(`${GRAPH_API_BASE}/ads_archive?${params.toString()}`)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Meta Graph API error (${res.status}): ${body}`)
  }

  const json = (await res.json()) as AdsArchiveResponse
  const byPage = new Map<string, AdvertiserPage>()
  for (const entry of json.data ?? []) {
    if (!entry.page_id || !entry.page_name) continue
    const existing = byPage.get(entry.page_id)
    if (existing) {
      existing.ad_count += 1
    } else {
      byPage.set(entry.page_id, { page_id: entry.page_id, page_name: entry.page_name, ad_count: 1 })
    }
  }
  return Array.from(byPage.values()).sort((a, b) => b.ad_count - a.ad_count).slice(0, 10)
}

/**
 * Whether a Page ID is real. Our token can't call the generic page-node
 * endpoint (/{page-id}) — that 403s with "requires pages_read_engagement /
 * Page Public Content Access", a permission this app doesn't have, even for
 * a perfectly valid ID. search_page_ids on ads_archive works with the scope
 * we do have, so validate through that instead: a 200 (even with zero ads
 * for the queried countries) means the ID resolves to a real page; Meta's
 * specific "Invalid Page ID" subcode means it doesn't.
 */
export async function isValidPageId(pageId: string): Promise<boolean> {
  const accessToken = process.env.META_GRAPH_API_ACCESS_TOKEN!
  const query = new URLSearchParams({
    ...baseParams(accessToken),
    search_page_ids: JSON.stringify([pageId]),
    fields: 'id',
  })
  query.set('limit', '1')

  const res = await fetch(`${GRAPH_API_BASE}/ads_archive?${query.toString()}`)
  if (res.ok) return true

  const body = (await res.json().catch(() => null)) as AdsArchiveErrorBody | null
  if (body?.error?.error_subcode === INVALID_PAGE_ID_SUBCODE) return false

  // Any other error (rate limit, transient) — don't block brand creation on it.
  return true
}

/** Validates a submitted Page ID: numeric format, and (when Meta is configured) that it resolves to a real page. Returns an error message, or null if valid. */
export async function validatePageId(pageId: string, metaConfigured: boolean): Promise<string | null> {
  if (!/^\d+$/.test(pageId)) {
    return 'Meta Page ID must be numbers only (e.g. 1234567890) — not a URL or page name. Use the search above to find the right page instead of typing an ID directly.'
  }
  if (metaConfigured) {
    const valid = await isValidPageId(pageId)
    if (!valid) {
      return `Meta Page ID ${pageId} doesn't match any page in the Ad Library. Use the search above to find it instead.`
    }
  }
  return null
}

export function mapPlatform(publisherPlatforms?: string[]): 'facebook' | 'instagram' | 'tiktok' | 'other' {
  const first = publisherPlatforms?.[0]?.toLowerCase()
  if (first === 'facebook') return 'facebook'
  if (first === 'instagram') return 'instagram'
  return 'other'
}
