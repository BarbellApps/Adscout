import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Radar, Users, Globe, Link2, Flame } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SyncBrandButton } from '@/components/scout/SyncBrandButton'
import { EditPageIdButton } from '@/components/scout/EditPageIdButton'
import { AdCard } from '@/components/scout/AdCard'
import { createClient } from '@/lib/supabase/server'
import { isMetaGraphConfigured } from '@/lib/meta/config'
import { formatCompactNumber } from '@/lib/utils'
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
  let total = 0
  for (const ad of rows) {
    const platforms = ad.publisher_platforms?.length ? ad.publisher_platforms : [ad.platform]
    for (const p of platforms) {
      counts.set(p, (counts.get(p) ?? 0) + 1)
      total += 1
    }
  }
  return Array.from(counts.entries())
    .map(([platform, count]) => ({
      platform: platform.replace('_', ' '),
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

interface GroupedInsight {
  label: string
  count: number
  maxRuntime: number
  totalReach: number
}

function groupBy(rows: Ad[], key: (ad: Ad) => string | null): GroupedInsight[] {
  const groups = new Map<string, GroupedInsight>()
  for (const ad of rows) {
    const label = key(ad)?.trim()
    if (!label) continue
    const existing = groups.get(label)
    if (existing) {
      existing.count += 1
      existing.maxRuntime = Math.max(existing.maxRuntime, ad.runtime_days)
      existing.totalReach += ad.eu_total_reach ?? 0
    } else {
      groups.set(label, { label, count: 1, maxRuntime: ad.runtime_days, totalReach: ad.eu_total_reach ?? 0 })
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.totalReach - a.totalReach || b.count - a.count)
}

interface AudienceAggregate {
  totalReach: number
  genderSplit: { label: string; value: number; pct: number }[]
  ageSplit: { label: string; value: number; pct: number }[]
  countrySplit: { label: string; value: number; pct: number }[]
}

function aggregateAudience(rows: Ad[]): AudienceAggregate | null {
  let male = 0
  let female = 0
  let unknown = 0
  const ages = new Map<string, number>()
  const countries = new Map<string, number>()

  for (const ad of rows) {
    for (const country of ad.demographic_breakdown ?? []) {
      let countryTotal = 0
      for (const b of country.age_gender_breakdowns ?? []) {
        const m = b.male ?? 0
        const f = b.female ?? 0
        const u = b.unknown ?? 0
        male += m
        female += f
        unknown += u
        countryTotal += m + f + u
        ages.set(b.age_range, (ages.get(b.age_range) ?? 0) + m + f + u)
      }
      countries.set(country.country, (countries.get(country.country) ?? 0) + countryTotal)
    }
  }

  const total = male + female + unknown
  if (total === 0) return null

  const pct = (v: number, of: number) => Math.round((v / of) * 100)
  const toSplit = (map: Map<string, number>) => {
    const sum = Array.from(map.values()).reduce((a, b) => a + b, 0)
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value, pct: pct(value, sum) }))
      .sort((a, b) => b.value - a.value)
  }

  return {
    totalReach: total,
    genderSplit: [
      { label: 'Female', value: female, pct: pct(female, total) },
      { label: 'Male', value: male, pct: pct(male, total) },
      ...(unknown > 0 ? [{ label: 'Unknown', value: unknown, pct: pct(unknown, total) }] : []),
    ].sort((a, b) => b.value - a.value),
    ageSplit: toSplit(ages).slice(0, 4),
    countrySplit: toSplit(countries).slice(0, 4),
  }
}

function countNewThisWeek(rows: Ad[]): number {
  const now = Date.now()
  return rows.filter((a) => now - new Date(a.first_seen).getTime() < 7 * DAY_MS).length
}

function SplitBars({ items }: { items: { label: string; pct: number }[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-foreground">{item.label}</span>
            <span className="text-muted-foreground font-mono">{item.pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${item.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
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
  const totalReach = rows.reduce((sum, a) => sum + (a.eu_total_reach ?? 0), 0)
  const trend = buildAdTrend(rows, 14)
  const maxTrend = Math.max(1, ...trend.map((t) => t.count))
  const platformMix = buildPlatformMix(rows)
  const topHooks = groupBy(rows, (a) => a.hook).slice(0, 6)
  const topAngles = groupBy(rows, (a) => a.angle).slice(0, 6)
  const landingPages = groupBy(rows, (a) => a.link_caption).slice(0, 6)
  const audience = aggregateAudience(rows)
  const languages = Array.from(new Set(rows.flatMap((a) => a.languages ?? [])))
  const targetLocations = Array.from(new Set(rows.flatMap((a) => (a.target_locations ?? []).filter((l) => !l.excluded).map((l) => l.name)))).slice(0, 6)

  return (
    <div>
      <Link href="/scout" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />
        Scout
      </Link>

      {/* Brand header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold shrink-0">
            {brand.page_name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-semibold tracking-tight text-foreground">{brand.page_name}</h1>
              {activeCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#12A66A]/10 text-[#12A66A] text-[11px] font-medium px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12A66A]" />
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Tracked since {new Date(brand.added_at).toLocaleDateString()} · data from the Meta Ad Library
            </p>
          </div>
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
          description="A page name alone can't be scoped to one business in the Meta Ad Library and will pull in unrelated advertisers. Use the search to find the exact page."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="No ads synced yet"
          description="Sync this brand to pull its currently running ads from the Meta Ad Library."
        />
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-1">Active ads</p>
                <p className="text-2xl font-semibold text-foreground font-mono">{activeCount}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">of {rows.length} synced</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-1">New this week</p>
                <p className="text-2xl font-semibold text-foreground font-mono">{newThisWeek}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">first seen &lt;7 days ago</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-1">EU reach</p>
                <p className="text-2xl font-semibold text-foreground font-mono">{formatCompactNumber(totalReach)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">people reached, all synced ads</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-1">Landing pages</p>
                <p className="text-2xl font-semibold text-foreground font-mono">{landingPages.length}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">distinct destinations</p>
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
              <CardContent>
                <p className="text-sm font-medium text-foreground mb-3">Top platforms</p>
                <SplitBars items={platformMix.map((p) => ({ label: p.platform, pct: p.pct }))} />
              </CardContent>
            </Card>
          </div>

          {/* Audience insights + targeting */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Audience insights</p>
                </div>
                {audience ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Gender (actual reach)</p>
                      <SplitBars items={audience.genderSplit} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Age ranges</p>
                      <SplitBars items={audience.ageSplit.map((a) => ({ label: a.label, pct: a.pct }))} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Countries</p>
                      <SplitBars items={audience.countrySplit.map((c) => ({ label: c.label, pct: c.pct }))} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      From Meta&apos;s DSA reach breakdown across {formatCompactNumber(audience.totalReach)} reached people.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No demographic reach data returned for these ads yet — re-sync after ads have been delivering for a while.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Targeting</p>
                </div>
                <div className="space-y-3 text-sm">
                  {targetLocations.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Locations</p>
                      <div className="flex flex-wrap gap-1.5">
                        {targetLocations.map((loc) => <Badge key={loc} variant="outline">{loc}</Badge>)}
                      </div>
                    </div>
                  )}
                  {rows.some((a) => a.target_ages) && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Age targeting</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(new Set(rows.filter((a) => a.target_ages).map((a) => `${a.target_ages![0]}–${a.target_ages![1] ?? '65+'}`))).map((range) => (
                          <Badge key={range} variant="outline">{range}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {rows.some((a) => a.target_gender) && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Gender targeting</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(new Set(rows.map((a) => a.target_gender).filter(Boolean) as string[])).map((g) => (
                          <Badge key={g} variant="outline">{g}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {languages.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Languages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {languages.map((lang) => <Badge key={lang} variant="outline">{lang.toUpperCase()}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hooks + angles (AI-extracted from real copy) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardContent>
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Top hooks</p>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">Extracted from real ad copy by AI, ranked by reach.</p>
                {topHooks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sync again to analyze ad copy — hooks appear after AI enrichment runs.</p>
                ) : (
                  <div className="space-y-1">
                    {topHooks.map((h, i) => (
                      <div key={h.label} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-border last:border-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs text-muted-foreground font-mono shrink-0">{i + 1}</span>
                          <span className="text-foreground truncate">{h.label}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                          {h.count} ads{h.totalReach > 0 && ` · ${formatCompactNumber(h.totalReach)} reach`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex items-center gap-2 mb-1">
                  <Radar className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Top angles</p>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">The persuasion angles this brand leans on most.</p>
                {topAngles.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sync again to analyze ad copy — angles appear after AI enrichment runs.</p>
                ) : (
                  <div className="space-y-1">
                    {topAngles.map((a, i) => (
                      <div key={a.label} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-border last:border-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs text-muted-foreground font-mono shrink-0">{i + 1}</span>
                          <span className="text-foreground truncate">{a.label}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                          {a.count} ads{a.totalReach > 0 && ` · ${formatCompactNumber(a.totalReach)} reach`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Landing pages */}
          {landingPages.length > 0 && (
            <Card className="mb-4">
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Link2 className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Landing pages</p>
                </div>
                <div className="space-y-1">
                  {landingPages.map((l) => (
                    <div key={l.label} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-border last:border-0">
                      <span className="text-foreground font-mono text-xs truncate">{l.label}</span>
                      <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                        {l.count} ads{l.totalReach > 0 && ` · ${formatCompactNumber(l.totalReach)} reach`}
                      </span>
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
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
