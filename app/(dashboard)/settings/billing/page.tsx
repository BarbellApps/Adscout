import { CreditCard } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ManageBillingButton, UpgradeButtons } from '@/components/billing/BillingActions'
import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS } from '@/lib/utils/gates'
import { PLANS, type PlanKey } from '@/lib/stripe/plans'
import type { SubscriptionTier } from '@/types'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('users')
        .select('subscription_tier, subscription_status, canvas_credits_remaining')
        .eq('id', user.id)
        .single()
    : { data: null }

  const tier = (profile?.subscription_tier ?? 'free') as SubscriptionTier
  const isSubscribed = tier !== 'free' && profile?.subscription_status === 'active'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription plan and Canvas credit usage
        </p>
      </div>

      {!isSubscribed ? (
        <EmptyState
          icon={CreditCard}
          title="No active subscription"
          description="Choose Starter, Premium, or Pro to unlock Scout, Explore, and AI Canvas."
        />
      ) : (
        <Card className="max-w-md mb-6">
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{PLANS[tier as PlanKey]?.name ?? tier}</p>
              <Badge variant="outline">{profile?.subscription_status}</Badge>
            </div>
            {TIER_LIMITS[tier].canvas_credits_per_month > 0 && (
              <p className="text-xs text-muted-foreground">
                {profile?.canvas_credits_remaining ?? 0} / {TIER_LIMITS[tier].canvas_credits_per_month} Canvas credits remaining this cycle
              </p>
            )}
            <ManageBillingButton />
          </CardContent>
        </Card>
      )}

      {!isSubscribed && (
        <div className="mt-6">
          <UpgradeButtons />
        </div>
      )}
    </div>
  )
}
