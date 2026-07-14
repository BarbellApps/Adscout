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

// Meta's "Invalid Page ID" error for search_page_ids — a stale, mistyped, or
// wrong-object ID. Distinct from other 400s (bad token, malformed request)
// which should still surface to the caller.
const INVALID_PAGE_ID_SUBCODE = 2334021

function buildQuery(accessToken: string, params: { searchTerms?: string; pageId?: string; countries?: string[] }) {
  const query = new URLSearchParams({
    access_token: accessToken,
    ad_type: 'ALL',
    ad_reached_countries: JSON.stringify(params.countries ?? DEFAULT_AD_REACHED_COUNTRIES),
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

  if (params.searchTerms) query.set('search_terms', params.searchTerms)
  if (params.pageId) query.set('search_page_ids', JSON.stringify([params.pageId]))
  return query
}

export async function searchAdsArchive(params: {
  searchTerms?: string
  pageId?: string
  countries?: string[]
}): Promise<AdsArchiveEntry[]> {
  const accessToken = process.env.META_GRAPH_API_ACCESS_TOKEN!

  const res = await fetch(`${GRAPH_API_BASE}/ads_archive?${buildQuery(accessToken, params).toString()}`)

  if (!res.ok) {
    const body = await res.text()

    // A bad stored page_id shouldn't hard-fail the whole sync when we also
    // have a page name to search by — retry once on search_terms alone.
    if (params.pageId && params.searchTerms) {
      const parsed = safeParseJson(body)
      if (parsed?.error?.error_subcode === INVALID_PAGE_ID_SUBCODE) {
        const retryRes = await fetch(`${GRAPH_API_BASE}/ads_archive?${buildQuery(accessToken, { ...params, pageId: undefined }).toString()}`)
        if (retryRes.ok) {
          const retryJson = (await retryRes.json()) as AdsArchiveResponse
          return retryJson.data ?? []
        }
      }
    }

    throw new Error(`Meta Graph API error (${res.status}): ${body}`)
  }

  const json = (await res.json()) as AdsArchiveResponse
  return json.data ?? []
}

function safeParseJson(body: string): { error?: { error_subcode?: number } } | null {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

/** Resolves a Page ID to a real, accessible Facebook Page, or null if it doesn't exist. */
export async function resolvePageId(pageId: string): Promise<{ id: string; name: string } | null> {
  const accessToken = process.env.META_GRAPH_API_ACCESS_TOKEN!
  const res = await fetch(`${GRAPH_API_BASE}/${encodeURIComponent(pageId)}?fields=id,name&access_token=${accessToken}`)
  if (!res.ok) return null
  const json = await res.json()
  return json?.id ? { id: json.id, name: json.name } : null
}

export function mapPlatform(publisherPlatforms?: string[]): 'facebook' | 'instagram' | 'tiktok' | 'other' {
  const first = publisherPlatforms?.[0]?.toLowerCase()
  if (first === 'facebook') return 'facebook'
  if (first === 'instagram') return 'instagram'
  return 'other'
}
