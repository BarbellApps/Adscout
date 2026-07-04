import { LayoutTemplate, ExternalLink } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import type { Ad } from '@/types'

interface TemplateRow {
  id: string
  industry: string | null
  format: string | null
  canva_url: string | null
  figma_url: string | null
  ads: Pick<Ad, 'headline' | 'hook' | 'media_url'> | null
}

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; format?: string }>
}) {
  const { industry, format } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('templates')
    .select('id, industry, format, canva_url, figma_url, ads(headline, hook, media_url)')
    .order('created_at', { ascending: false })

  if (industry) query = query.eq('industry', industry)
  if (format) query = query.eq('format', format)

  const { data: templates } = await query
  const rows = (templates ?? []) as unknown as TemplateRow[]

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Templates</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Ad Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          High-performing ad templates curated weekly from proven Meta ads. Open in Canva or Figma to customize.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="Template library is empty"
          description="Templates are curated weekly from ads with 30+ day runtime, a $10M+ brand, or a standout hook. None have been added yet."
          action={{ label: 'Learn how curation works', href: '/settings/integrations' }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {t.industry && <Badge variant="outline">{t.industry}</Badge>}
                  {t.format && <Badge variant="outline">{t.format}</Badge>}
                </div>
                <p className="text-sm font-medium text-foreground">
                  {t.ads?.headline ?? 'Untitled template'}
                </p>
                {t.ads?.hook && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.ads.hook}</p>
                )}
                <div className="flex gap-2 pt-1">
                  {t.canva_url && (
                    <a href={t.canva_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      Open in Canva <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {t.figma_url && (
                    <a href={t.figma_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      Open in Figma <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
