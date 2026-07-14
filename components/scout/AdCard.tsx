'use client'

import { useState } from 'react'
import { ExternalLink, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatCompactNumber } from '@/lib/utils'
import type { Ad } from '@/types'

function publicAdLibraryUrl(externalId: string | null): string | null {
  return externalId ? `https://www.facebook.com/ads/library/?id=${externalId}` : null
}

function AdPreviewFrame({ adId, className }: { adId: string; className?: string }) {
  // Meta's render_ad page is ~540px wide; scale it down to fit the card.
  return (
    <div className={`relative overflow-hidden bg-muted ${className ?? ''}`}>
      <iframe
        src={`/api/ads/${adId}/preview`}
        loading="lazy"
        className="absolute top-0 left-0 origin-top-left border-0 pointer-events-none"
        style={{ width: '540px', height: '640px', transform: 'scale(0.62)' }}
        scrolling="no"
        title="Ad creative preview"
      />
    </div>
  )
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

function adAudience(ad: Ad) {
  let male = 0
  let female = 0
  let unknown = 0
  const ages = new Map<string, number>()
  const countries = new Map<string, number>()
  for (const country of ad.demographic_breakdown ?? []) {
    let countryTotal = 0
    for (const b of country.age_gender_breakdowns ?? []) {
      const m = b.male ?? 0
      const f = b.female ?? 0
      const u = b.unknown ?? 0
      male += m; female += f; unknown += u
      countryTotal += m + f + u
      ages.set(b.age_range, (ages.get(b.age_range) ?? 0) + m + f + u)
    }
    countries.set(country.country, (countries.get(country.country) ?? 0) + countryTotal)
  }
  const total = male + female + unknown
  if (total === 0) return null
  const pct = (v: number, of: number) => Math.round((v / of) * 100)
  const toSplit = (map: Map<string, number>) => {
    const sum = Array.from(map.values()).reduce((a, b) => a + b, 0)
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, pct: pct(value, sum) }))
      .sort((a, b) => b.pct - a.pct)
  }
  return {
    total,
    gender: [
      { label: 'Female', pct: pct(female, total) },
      { label: 'Male', pct: pct(male, total) },
      ...(unknown > 0 ? [{ label: 'Unknown', pct: pct(unknown, total) }] : []),
    ].sort((a, b) => b.pct - a.pct),
    ages: toSplit(ages).slice(0, 5),
    countries: toSplit(countries).slice(0, 5),
  }
}

export function AdCard({ ad }: { ad: Ad }) {
  const [open, setOpen] = useState(false)
  const audience = adAudience(ad)
  const libraryUrl = publicAdLibraryUrl(ad.external_id)
  const targetLocations = (ad.target_locations ?? []).filter((l) => !l.excluded).map((l) => l.name)

  return (
    <>
      <Card className="cursor-pointer transition-shadow hover:shadow-md pt-0 overflow-hidden" onClick={() => setOpen(true)}>
        <AdPreviewFrame adId={ad.id} className="h-64 w-full" />
        <CardContent className="space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={ad.is_active ? 'default' : 'outline'}>{ad.is_active ? 'Active' : 'Inactive'}</Badge>
            {ad.runtime_days > 0 && <Badge variant="outline">{ad.runtime_days}d runtime</Badge>}
            {typeof ad.eu_total_reach === 'number' && <Badge variant="outline">{formatCompactNumber(ad.eu_total_reach)} reach</Badge>}
          </div>
          <p className="text-sm font-medium text-foreground">{ad.headline ?? 'Untitled ad'}</p>
          {ad.body_copy && <p className="text-xs text-muted-foreground line-clamp-2">{ad.body_copy}</p>}
          {(ad.hook || ad.angle) && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {ad.hook && <span className="text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5">{ad.hook}</span>}
              {ad.angle && <span className="text-[10px] rounded bg-muted text-muted-foreground px-1.5 py-0.5">{ad.angle}</span>}
            </div>
          )}
          <p className="text-[11px] text-primary flex items-center gap-1 pt-0.5">
            <BarChart3 className="w-3 h-3" />
            View analytics
          </p>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{ad.headline ?? 'Untitled ad'}</SheetTitle>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <Badge variant={ad.is_active ? 'default' : 'outline'}>{ad.is_active ? 'Active' : 'Inactive'}</Badge>
              {(ad.publisher_platforms ?? [ad.platform]).map((p) => (
                <Badge key={p} variant="outline" className="capitalize">{p.replace('_', ' ')}</Badge>
              ))}
            </div>
          </SheetHeader>

          <div className="px-4 pb-6 space-y-5">
            {/* Creative preview */}
            <AdPreviewFrame adId={ad.id} className="h-[400px] w-full rounded-lg border border-border" />

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground mb-0.5">EU reach</p>
                <p className="text-lg font-semibold text-foreground font-mono">
                  {typeof ad.eu_total_reach === 'number' ? formatCompactNumber(ad.eu_total_reach) : '—'}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground mb-0.5">Runtime</p>
                <p className="text-lg font-semibold text-foreground font-mono">{ad.runtime_days}d</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground mb-0.5">First seen</p>
                <p className="text-sm font-semibold text-foreground font-mono pt-1">
                  {new Date(ad.first_seen).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* AI creative analysis */}
            {(ad.hook || ad.angle || ad.cta) && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Creative analysis</p>
                <div className="space-y-1.5 text-sm">
                  {ad.hook && (
                    <div className="flex gap-2">
                      <span className="text-xs text-muted-foreground w-14 shrink-0 pt-0.5">Hook</span>
                      <span className="text-foreground">{ad.hook}</span>
                    </div>
                  )}
                  {ad.angle && (
                    <div className="flex gap-2">
                      <span className="text-xs text-muted-foreground w-14 shrink-0 pt-0.5">Angle</span>
                      <span className="text-foreground">{ad.angle}</span>
                    </div>
                  )}
                  {ad.cta && (
                    <div className="flex gap-2">
                      <span className="text-xs text-muted-foreground w-14 shrink-0 pt-0.5">CTA</span>
                      <span className="text-foreground">{ad.cta}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ad copy */}
            {ad.body_copy && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Ad copy</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap rounded-lg bg-muted p-3">{ad.body_copy}</p>
              </div>
            )}

            {/* Per-ad audience breakdown */}
            {audience && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Who this ad reached</p>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Meta&apos;s actual delivery breakdown — {formatCompactNumber(audience.total)} people in the EU.
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Gender</p>
                    <SplitBars items={audience.gender} />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Age</p>
                    <SplitBars items={audience.ages} />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Country</p>
                    <SplitBars items={audience.countries} />
                  </div>
                </div>
              </div>
            )}

            {/* Targeting */}
            {(targetLocations.length > 0 || ad.target_ages || ad.target_gender) && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Targeting</p>
                <div className="flex flex-wrap gap-1.5">
                  {ad.target_ages && <Badge variant="outline">Ages {ad.target_ages[0]}–{ad.target_ages[1] ?? '65+'}</Badge>}
                  {ad.target_gender && <Badge variant="outline">{ad.target_gender}</Badge>}
                  {targetLocations.map((loc) => <Badge key={loc} variant="outline">{loc}</Badge>)}
                  {(ad.languages ?? []).map((lang) => <Badge key={lang} variant="outline">{lang.toUpperCase()}</Badge>)}
                </div>
              </div>
            )}

            {/* Landing page */}
            {ad.link_caption && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1.5">Landing page</p>
                <p className="text-xs font-mono text-foreground">{ad.link_caption}</p>
                {ad.link_description && <p className="text-xs text-muted-foreground mt-1">{ad.link_description}</p>}
              </div>
            )}

            {libraryUrl && (
              <a
                href={libraryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View on Meta Ad Library <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
