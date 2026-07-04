import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/server'
import type { Ad } from '@/types'

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let ads: Ad[] = []
  if (q?.trim()) {
    // PostgREST's .or() filter string treats `,`, `(`, `)`, and `.` as
    // syntax, not literal search characters — strip them so a search term
    // can't alter the intended filter shape.
    const safeQuery = q.replace(/[,().]/g, ' ').trim()
    const { data } = await supabase
      .from('ads')
      .select('*')
      .or(`headline.ilike.%${safeQuery}%,body_copy.ilike.%${safeQuery}%`)
      .order('runtime_days', { ascending: false })
      .limit(30)
    ads = (data ?? []) as Ad[]
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Explore</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Explore Ads</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search ads synced via Scout or captured with the Chrome extension.
        </p>
      </div>

      <form className="mb-6 max-w-md">
        <Input name="q" defaultValue={q} placeholder="Search headline or body copy…" />
      </form>

      {!q?.trim() ? (
        <EmptyState
          icon={Compass}
          title="Search the ad index"
          description="Enter a keyword to find ads across brands you track in Scout or have saved via the Chrome extension. The index grows as you add more brands."
        />
      ) : ads.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No matches"
          description={`No ads found for "${q}". Try a different keyword, or track more brands in Scout.`}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline">{ad.platform}</Badge>
                  <Badge variant="outline">{ad.source}</Badge>
                  {ad.runtime_days > 0 && <Badge variant="outline">{ad.runtime_days}d runtime</Badge>}
                </div>
                <p className="text-sm font-medium text-foreground">{ad.headline ?? 'Untitled ad'}</p>
                {ad.body_copy && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{ad.body_copy}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
