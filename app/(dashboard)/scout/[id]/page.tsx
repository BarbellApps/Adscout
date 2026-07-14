import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Radar, ExternalLink } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SyncBrandButton } from '@/components/scout/SyncBrandButton'
import { EditPageIdButton } from '@/components/scout/EditPageIdButton'
import { createClient } from '@/lib/supabase/server'
import { isMetaGraphConfigured } from '@/lib/meta/config'
import type { Ad } from '@/types'

const DAY_MS = 86_400_000

function buildAdTrend(rows: Ad[], days: number) {
  const buckets = new Map<string, number>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS)
    buckets.set(d.toISOString().slice(0, 10), 0)
  }

  for (const ad of rows) {
    const key = new Date(ad.first_seen).toISOString().slice(0, 10)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }))
}

function buildPlatformMix(rows: Ad[]) {
  const counts = new Map<string, number>()
  for (const ad of rows) counts.set(ad.platform, (counts.get(ad.platform) ?? 0) + 1)
  return Array.from(counts.entries())
    .map(([platform, count]) => ({ platform, count, pct: Math.round((count / rows.length) * 100) }))
    .sort((a, b) => b.count - a.count)
}

function buildTopHeadlines(rows: Ad[]) {
  const groups = new Map<string, { count: number; maxRuntime: number; latestSeen: string }>()
  for (const ad of rows) {
    const key = ad.headline?.trim() || 'Untitled ad'
    const existing = groups.get(key)
    if (existing) {
      existing.count += 1
      existing.maxRuntime = Math.max(existing.maxRuntime, ad.runtime_days)
      if (ad.first_seen > existing.latestSeen) existing.latestSeen = ad.first_seen
    } else {
      groups.set(key, { count: 1, maxRuntime: ad.runtime_days, latestSeen: ad.first_seen })
    }
  }
  return Array.from(groups.entries())
    .map(([headline, v]) => ({ headline, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

function countNewThisWeek(rows: Ad[]): number {
  const now = Date.now()
  return rows.filter((a) => now - new Date(a.first_seen).getTime() < 7 * DAY_MS).length
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: brand } = await supabase
    .from('brands')
    .select('id, page_name, page_id, platform, added_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!brand) notFound()

  const { data: ads } = await supabase
    .from('ads')
    .select('*')
    .eq('brand_id', id)
    .order('first_seen', { ascending: false })

  const rows = (ads ?? []) as Ad[]
  const metaConfigured = isMetaGraphConfigured()

  const activeCount = rows.filter((a) => a.is_active).length
  const newThisWeek = countNewThisWeek(rows)
  const trend = buildAdTrend(rows, 14)
  const maxTrend = Math.max(1, ...trend.map((t) => t.count))
  const platformMix = buildPlatformMix(rows)
  const topHeadlines = buildTopHeadlines(rows)

  return (
    <div>
      <Link href="/scout" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />
        Scout
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">{brand.page_name}</h1>
            <Badge variant="outline">{brand.platform}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Tracked since {new Date(brand.added_at).toLocaleDateString()}
          </p>
        </div>
        {brand.page_id ? (
          <SyncBrandButton brandId={brand.id} metaConfigured={metaConfigured} />
        ) : (
          <EditPageIdButton brandId={brand.id} pageName={brand.page_name} />
        )}
      </div>

      {!brand.page_id ? (
        <EmptyState
          icon={Radar}
          title="Needs a Meta Page ID"
          description="A page name alone can't be scoped to one business in the Meta Ad Library and will pull in unrelated advertisers. Add this brand's numeric Page ID to sync accurately."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="No ads synced yet"
          description="Sync this brand to pull its currently running ads from the Meta Ad Library."
        />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-1">Total ads</p>
                <p className="text-2xl font-semibold text-foreground font-mono">{rows.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-1">Active</p>
                <p className="text-2xl font-semibold text-foreground font-mono">{activeCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-1">New this week</p>
                <p className="text-2xl font-semibold text-foreground font-mono">{newThisWeek}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-1">Longest running</p>
                <p className="text-2xl font-semibold text-foreground font-mono">
                  {Math.max(0, ...rows.map((a) => a.runtime_days))}d
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Trend + platform mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <Card className="lg:col-span-2">
              <CardContent>
                <p className="text-sm font-medium text-foreground mb-3">Ads first seen — last 14 days</p>
                <div className="flex items-end gap-1.5 h-28">
                  {trend.map((t) => (
                    <div key={t.date} className="flex-1 flex flex-col items-center gap-1 group/bar" title={`${t.date}: ${t.count}`}>
                      <div
                        className="w-full rounded-t bg-primary/70 group-hover/bar:bg-primary transition-colors"
                        style={{ height: `${Math.max(3, (t.count / maxTrend) * 100)}%`, minHeight: t.count > 0 ? '4px' : '2px' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">{new Date(trend[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(trend[trend.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2.5">
                <p className="text-sm font-medium text-foreground mb-1">Platform mix</p>
                {platformMix.map((p) => (
                  <div key={p.platform}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground capitalize">{p.platform}</span>
                      <span className="text-muted-foreground font-mono">{p.count} ({p.pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Top headlines by how many variants are running */}
          {topHeadlines.length > 1 && (
            <Card className="mb-4">
              <CardContent>
                <p className="text-sm font-medium text-foreground mb-3">Most-repeated headlines</p>
                <p className="text-[11px] text-muted-foreground mb-3">
                  How many separate ad variants share the same headline — a signal of what {brand.page_name} is scaling right now.
                </p>
                <div className="space-y-2">
                  {topHeadlines.map((h) => (
                    <div key={h.headline} className="flex items-center justify-between gap-4 text-sm py-1.5 border-b border-border last:border-0">
                      <span className="text-foreground truncate">{h.headline}</span>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">{h.count} variants &middot; {h.maxRuntime}d max</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full ad list */}
          <p className="text-sm font-medium text-foreground mb-3">All synced ads</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((ad) => (
              <Card key={ad.id}>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={ad.is_active ? 'default' : 'outline'}>{ad.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Badge variant="outline">{ad.platform}</Badge>
                    {ad.runtime_days > 0 && <Badge variant="outline">{ad.runtime_days}d runtime</Badge>}
                  </div>
                  <p className="text-sm font-medium text-foreground">{ad.headline ?? 'Untitled ad'}</p>
                  {ad.body_copy && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{ad.body_copy}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    First seen {new Date(ad.first_seen).toLocaleDateString()}
                  </p>
                  {ad.media_url && (
                    <a
                      href={ad.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 pt-1"
                    >
                      View on Meta Ad Library <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
