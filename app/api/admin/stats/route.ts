import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin'
import type { SubscriptionTier } from '@/types'

export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { admin } = ctx

  const [{ data: users }, brands, ads, collections, generations] = await Promise.all([
    admin.from('users').select('subscription_tier, subscription_status'),
    admin.from('brands').select('id', { count: 'exact', head: true }),
    admin.from('ads').select('id', { count: 'exact', head: true }),
    admin.from('collections').select('id', { count: 'exact', head: true }),
    admin.from('canvas_generations').select('id', { count: 'exact', head: true }),
  ])

  const tierCounts: Record<SubscriptionTier, number> = { free: 0, starter: 0, premium: 0, pro: 0 }
  let activeSubscriptions = 0
  for (const u of users ?? []) {
    const tier = (u.subscription_tier ?? 'free') as SubscriptionTier
    if (tier in tierCounts) tierCounts[tier] += 1
    if (u.subscription_status === 'active' && tier !== 'free') activeSubscriptions += 1
  }

  return NextResponse.json({
    total_users: users?.length ?? 0,
    tier_counts: tierCounts,
    active_subscriptions: activeSubscriptions,
    total_brands: brands.count ?? 0,
    total_ads: ads.count ?? 0,
    total_collections: collections.count ?? 0,
    total_canvas_generations: generations.count ?? 0,
  })
}
