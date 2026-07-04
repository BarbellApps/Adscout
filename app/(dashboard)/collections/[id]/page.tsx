import { notFound } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { RemoveAdButton } from '@/components/collections/RemoveAdButton'
import { createClient } from '@/lib/supabase/server'
import type { Ad } from '@/types'

interface CollectionAdRow {
  ad_id: string
  ads: Ad | null
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: collection } = await supabase
    .from('collections')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!collection) notFound()

  const { data: ads } = await supabase
    .from('collection_ads')
    .select('ad_id, ads(*)')
    .eq('collection_id', id)

  const rows = (ads ?? []) as unknown as CollectionAdRow[]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{collection.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{rows.length} saved ads</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No ads saved here yet"
          description="Save ads from Scout, Explore, or the Chrome extension into this collection."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((row) => (
            <Card key={row.ad_id}>
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {row.ads?.headline ?? 'Untitled ad'}
                  </p>
                  <RemoveAdButton collectionId={id} adId={row.ad_id} />
                </div>
                {row.ads?.body_copy && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{row.ads.body_copy}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
