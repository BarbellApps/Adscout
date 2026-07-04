import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashApiKey } from '@/lib/api-keys'
import { TIER_LIMITS } from '@/lib/utils/gates'
import type { SubscriptionTier } from '@/types'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const key = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!key) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: apiKey } = await admin
    .from('api_keys')
    .select('id, user_id')
    .eq('key_hash', hashApiKey(key))
    .single()

  if (!apiKey) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const { data: user } = await admin
    .from('users')
    .select('subscription_tier')
    .eq('id', apiKey.user_id)
    .single()

  const tier = (user?.subscription_tier ?? 'free') as SubscriptionTier
  if (!TIER_LIMITS[tier].chrome_extension) {
    return NextResponse.json(
      { error: 'Your plan does not include the Chrome extension. Upgrade to Starter or above.' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { headline, body_copy, media_url, platform, collection_id } = body as {
    headline?: string
    body_copy?: string
    media_url?: string
    platform?: string
    collection_id?: string
  }

  const { data: ad, error: adError } = await admin
    .from('ads')
    .insert({
      headline: headline ?? null,
      body_copy: body_copy ?? null,
      media_url: media_url ?? null,
      platform: platform ?? 'other',
      source: 'manual_capture',
    })
    .select('id')
    .single()

  if (adError || !ad) {
    return NextResponse.json({ error: adError?.message ?? 'Failed to save ad' }, { status: 500 })
  }

  let targetCollectionId = collection_id
  if (!targetCollectionId) {
    const { data: existing } = await admin
      .from('collections')
      .select('id')
      .eq('user_id', apiKey.user_id)
      .eq('name', 'Extension Saves')
      .maybeSingle()

    targetCollectionId = existing?.id
    if (!targetCollectionId) {
      const { data: created } = await admin
        .from('collections')
        .insert({ user_id: apiKey.user_id, name: 'Extension Saves' })
        .select('id')
        .single()
      targetCollectionId = created?.id
    }
  }

  if (targetCollectionId) {
    await admin.from('collection_ads').insert({ collection_id: targetCollectionId, ad_id: ad.id })
  }

  await admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKey.id)

  return NextResponse.json({ success: true, ad_id: ad.id })
}
