import { isMetaGraphConfigured } from '@/lib/meta/config'

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

export async function searchAdsArchive(params: {
  searchTerms?: string
  pageId?: string
  countries?: string[]
}): Promise<AdsArchiveEntry[]> {
  const accessToken = process.env.META_GRAPH_API_ACCESS_TOKEN!

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

  const res = await fetch(`${GRAPH_API_BASE}/ads_archive?${query.toString()}`)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Meta Graph API error (${res.status}): ${body}`)
  }

  const json = (await res.json()) as AdsArchiveResponse
  return json.data ?? []
}

export function mapPlatform(publisherPlatforms?: string[]): 'facebook' | 'instagram' | 'tiktok' | 'other' {
  const first = publisherPlatforms?.[0]?.toLowerCase()
  if (first === 'facebook') return 'facebook'
  if (first === 'instagram') return 'instagram'
  return 'other'
}
