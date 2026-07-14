import Link from 'next/link'
import { Radar } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NewBrandButton } from '@/components/scout/NewBrandButton'
import { SyncBrandButton } from '@/components/scout/SyncBrandButton'
import { RemoveBrandButton } from '@/components/scout/RemoveBrandButton'
import { createClient } from '@/lib/supabase/server'
import { isMetaGraphConfigured } from '@/lib/meta/config'
import { TIER_LIMITS } from '@/lib/utils/gates'
import type { SubscriptionTier } from '@/types'

interface BrandRow {
  id: string
  page_name: string
  page_id: string | null
  platform: string
  added_at: string
  ads: { count: number }[]
}

export default async function ScoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('users').select('subscription_tier').eq('id', user.id).single()
    : { data: null }

  const tier = (profile?.subscription_tier ?? 'free') as SubscriptionTier
  const limit = TIER_LIMITS[tier].scout_brand_limit
  const hasScout = limit !== 0
  const metaConfigured = isMetaGraphConfigured()

  const { data: brands } = user
    ? await supabase
        .from('brands')
        .select('id, page_name, page_id, platform, added_at, ads(count)')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })
    : { data: [] }

  const rows = (brands ?? []) as unknown as BrandRow[]

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Scout</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Competitor Scout</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track competitor brands and sync their Meta ad activity via the official Ad Library API.
            {limit > 0 && ` Your plan tracks up to ${limit} brands.`}
          </p>
        </div>
        {hasScout && <NewBrandButton />}
      </div>

      {!hasScout ? (
        <EmptyState
          icon={Radar}
          title="Scout is a Premium/Pro feature"
          description="Upgrade your plan to track competitor brands and sync their ad activity."
          action={{ label: 'View plans', href: '/settings/billing' }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="No brands tracked yet"
          description="Add a competitor brand by page name to start syncing their ad activity from the Meta Ad Library."
          action={{ label: 'Track a brand' }}
        />
      ) : (
        <>
          {!metaConfigured && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Scout sync needs a Meta Ad Library access token. Add{' '}
              <code className="font-mono text-xs">META_GRAPH_API_ACCESS_TOKEN</code> to{' '}
              <code className="font-mono text-xs">.env.local</code> (copy from Vercel → adscout → Environment Variables), then restart{' '}
              <code className="font-mono text-xs">npm run dev</code>.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((b) => (
            <Card key={b.id}>
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between">
                  <Link href={`/scout/${b.id}`} className="min-w-0 group/link">
                    <p className="text-sm font-medium text-foreground group-hover/link:text-primary transition-colors">{b.page_name}</p>
                    <Badge variant="outline" className="mt-1">{b.platform}</Badge>
                  </Link>
                  <RemoveBrandButton brandId={b.id} />
                </div>
                <Link href={`/scout/${b.id}`} className="text-xs text-muted-foreground hover:text-primary block">
                  {b.ads?.[0]?.count ?? 0} ads synced &rarr;
                </Link>
                <SyncBrandButton brandId={b.id} metaConfigured={metaConfigured} />
              </CardContent>
            </Card>
          ))}
          </div>
        </>
      )}
    </div>
  )
}
