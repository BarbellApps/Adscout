const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'

// Meta's ads_archive endpoint only reliably covers: (a) ads that reached
// the EU, per the DSA transparency requirement, regardless of category, and
// (b) political/social-issue/housing/employment/credit ads everywhere else.
// It will NOT return an arbitrary non-EU ecommerce competitor's ads — see
// CLAUDE.md §3. Default to EU countries so a sync actually returns results
// for a typical DTC/ecommerce brand.
export const DEFAULT_AD_REACHED_COUNTRIES = ['NL', 'DE', 'FR', 'IT', 'ES']

export interface AdsArchiveEntry {
  id: string
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

function buildQuery(accessToken: string, params: { pageId: string; countries?: string[] }) {
  const query = new URLSearchParams({
    access_token: accessToken,
    ad_type: 'ALL',
    ad_reached_countries: JSON.stringify(params.countries ?? DEFAULT_AD_REACHED_COUNTRIES),
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
  return query
}

// Deliberately scoped to search_page_ids only. Meta's search_terms does a
// broad keyword match across the *entire* ad library, not a filter on one
// page — for "MAEVA BELLE" it returned a French romance-novel app and Dutch
// diaper-bag ads. Misattributed ad data is worse than a sync that requires
// a real Page ID, so there is no keyword-search fallback here.
export async function searchAdsArchive(params: {
  pageId: string
  countries?: string[]
}): Promise<AdsArchiveEntry[]> {
  const accessToken = process.env.META_GRAPH_API_ACCESS_TOKEN!

  const res = await fetch(`${GRAPH_API_BASE}/ads_archive?${buildQuery(accessToken, params).toString()}`)

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Meta Graph API error (${res.status}): ${body}`)
  }

  const json = (await res.json()) as AdsArchiveResponse
  return json.data ?? []
}

/** Resolves a Page ID to a real, accessible Facebook Page, or null if it doesn't exist. */
export async function resolvePageId(pageId: string): Promise<{ id: string; name: string } | null> {
  const accessToken = process.env.META_GRAPH_API_ACCESS_TOKEN!
  const res = await fetch(`${GRAPH_API_BASE}/${encodeURIComponent(pageId)}?fields=id,name&access_token=${accessToken}`)
  if (!res.ok) return null
  const json = await res.json()
  return json?.id ? { id: json.id, name: json.name } : null
}

/** Validates a submitted Page ID: numeric format, and (when Meta is configured) that it resolves to a real page. Returns an error message, or null if valid. */
export async function validatePageId(pageId: string, metaConfigured: boolean): Promise<string | null> {
  if (!/^\d+$/.test(pageId)) {
    return 'Meta Page ID must be numbers only (e.g. 1234567890) — not a URL or page name. Find it under the page\'s "About" tab, or its "Page Transparency" section on Facebook.'
  }
  if (metaConfigured) {
    const resolved = await resolvePageId(pageId)
    if (!resolved) {
      return `Meta Page ID ${pageId} doesn't match any accessible Facebook page. Double-check it in the page's "Page Transparency" section.`
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
