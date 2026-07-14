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
    .select('id, page_name, page_id, platform')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!brand) notFound()

  const { data: ads } = await supabase
    .from('ads')
    .select('*')
    .eq('brand_id', id)
    .order('runtime_days', { ascending: false })

  const rows = (ads ?? []) as Ad[]
  const metaConfigured = isMetaGraphConfigured()

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
          <p className="text-sm text-muted-foreground">{rows.length} ads synced from the Meta Ad Library</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
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
      )}
    </div>
  )
}
