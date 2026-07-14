import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NewCanvasProjectButton } from '@/components/canvas/NewCanvasProjectButton'
import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS } from '@/lib/utils/gates'
import type { SubscriptionTier } from '@/types'

interface ProjectRow {
  id: string
  name: string
  created_at: string
  canvas_generations: { count: number }[]
}

export default async function CanvasPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: profile } = authUser
    ? await supabase
        .from('users')
        .select('subscription_tier, canvas_credits_remaining')
        .eq('id', authUser.id)
        .single()
    : { data: null }

  const tier = (profile?.subscription_tier ?? 'free') as SubscriptionTier
  const hasCanvas = TIER_LIMITS[tier].canvas_credits_per_month > 0

  const { data: projects } = authUser
    ? await supabase
        .from('canvas_projects')
        .select('id, name, created_at, canvas_generations(count)')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const rows = (projects ?? []) as unknown as ProjectRow[]

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Canvas</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">AI Canvas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate ad scripts with Claude. Credits reset monthly with your plan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasCanvas && (
            <Badge variant="outline">{profile?.canvas_credits_remaining ?? 0} credits left</Badge>
          )}
          {hasCanvas && <NewCanvasProjectButton />}
        </div>
      </div>

      {!hasCanvas ? (
        <EmptyState
          icon={Sparkles}
          title="AI Canvas is a Premium/Pro feature"
          description="Upgrade your plan to generate ad scripts and variations with Claude."
          action={{ label: 'View plans', href: '/settings/billing' }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Start your first Canvas project"
          description="Describe your product and let Claude generate ad script variations with different hooks and angles."
          action={{ label: 'New Canvas project' }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((p) => (
            <Link key={p.id} href={`/canvas/${p.id}`}>
              <Card className="hover:ring-primary/40 transition-shadow">
                <CardContent>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.canvas_generations?.[0]?.count ?? 0} generations
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
