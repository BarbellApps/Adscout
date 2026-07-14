import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchAdsArchive, mapPlatform } from '@/lib/meta/graph-api'
import { isMetaGraphConfigured } from '@/lib/meta/config'
import { TIER_LIMITS } from '@/lib/utils/gates'
import type { SubscriptionTier } from '@/types'

function runtimeDays(start?: string, stop?: string): number {
  if (!start) return 0
  const startMs = new Date(start).getTime()
  const endMs = stop ? new Date(stop).getTime() : Date.now()
  return Math.max(0, Math.round((endMs - startMs) / 86_400_000))
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { brand_id: brandId } = await req.json().catch(() => ({}))
  if (!brandId) {
    return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const tier = (profile?.subscription_tier ?? 'free') as SubscriptionTier
  if (TIER_LIMITS[tier].scout_brand_limit === 0) {
    return NextResponse.json({ error: 'Scout requires the Premium or Pro plan.' }, { status: 403 })
  }

  const { data: brand } = await supabase
    .from('brands')
    .select('id, page_name, page_id')
    .eq('id', brandId)
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  if (!isMetaGraphConfigured()) {
    return NextResponse.json(
      { error: 'Meta Ad Library API is not configured. Add META_GRAPH_API_ACCESS_TOKEN to your environment.' },
      { status: 503 }
    )
  }

  if (!brand.page_id) {
    return NextResponse.json(
      { error: 'This brand needs a Meta Page ID to sync accurately. Searching by name alone can\'t be scoped to one business and returns unrelated ads — edit the brand and add its numeric Page ID.' },
      { status: 400 }
    )
  }

  let entries
  try {
    entries = await searchAdsArchive({ pageId: brand.page_id })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Meta Graph API request failed' },
      { status: 502 }
    )
  }

  const rows = entries.map((entry) => ({
    brand_id: brand.id,
    platform: mapPlatform(entry.publisher_platforms),
    external_id: entry.id,
    headline: entry.ad_creative_link_titles?.[0] ?? null,
    body_copy: entry.ad_creative_bodies?.[0] ?? null,
    media_url: entry.ad_snapshot_url ?? null,
    first_seen: entry.ad_delivery_start_time ?? new Date().toISOString(),
    last_seen: entry.ad_delivery_stop_time ?? new Date().toISOString(),
    runtime_days: runtimeDays(entry.ad_delivery_start_time, entry.ad_delivery_stop_time),
    // Meta omits ad_delivery_stop_time for ads that are still running.
    is_active: !entry.ad_delivery_stop_time,
    source: 'graph_api' as const,
  }))

  if (rows.length === 0) {
    return NextResponse.json({ synced: 0 })
  }

  const { error } = await supabase.from('ads').upsert(rows, { onConflict: 'external_id' })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ synced: rows.length })
}
