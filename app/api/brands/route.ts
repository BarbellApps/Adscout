import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolvePageId } from '@/lib/meta/graph-api'
import { isMetaGraphConfigured } from '@/lib/meta/config'
import { TIER_LIMITS } from '@/lib/utils/gates'
import type { SubscriptionTier } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('brands')
    .select('id, page_name, page_id, platform, added_at, ads(count)')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ brands: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { page_name: pageName, page_id: pageId, platform } = await req.json()
  if (!pageName || typeof pageName !== 'string' || !pageName.trim()) {
    return NextResponse.json({ error: 'page_name is required' }, { status: 400 })
  }

  const trimmedPageId = typeof pageId === 'string' ? pageId.trim() : ''
  if (trimmedPageId) {
    if (!/^\d+$/.test(trimmedPageId)) {
      return NextResponse.json(
        { error: 'Meta Page ID must be numbers only (e.g. 1234567890) — not a URL or page name. Find it under the page\'s "About" tab, or leave it blank to search by name instead.' },
        { status: 400 }
      )
    }
    if (isMetaGraphConfigured()) {
      const resolved = await resolvePageId(trimmedPageId)
      if (!resolved) {
        return NextResponse.json(
          { error: `Meta Page ID ${trimmedPageId} doesn't match any accessible Facebook page. Double-check it, or leave it blank to search by name instead.` },
          { status: 400 }
        )
      }
    }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const tier = (profile?.subscription_tier ?? 'free') as SubscriptionTier
  const limit = TIER_LIMITS[tier].scout_brand_limit

  if (limit === 0) {
    return NextResponse.json(
      { error: 'Scout requires the Premium or Pro plan.' },
      { status: 403 }
    )
  }

  if (limit > 0) {
    const { count } = await supabase
      .from('brands')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: `Your plan tracks up to ${limit} brands. Upgrade to Pro for unlimited brands.` },
        { status: 403 }
      )
    }
  }

  const { data, error } = await supabase
    .from('brands')
    .insert({
      user_id: user.id,
      page_name: pageName.trim(),
      page_id: trimmedPageId || null,
      platform: platform || 'facebook',
    })
    .select('id, page_name, page_id, platform, added_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ brand: data })
}
