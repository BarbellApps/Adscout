'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PLANS, type PlanKey } from '@/lib/stripe/plans'

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (data.url) window.location.assign(data.url)
  }

  return (
    <Button onClick={handleClick} disabled={loading} size="sm">
      {loading ? 'Opening…' : 'Manage subscription'}
    </Button>
  )
}

export function UpgradeButtons() {
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)

  async function handleUpgrade(plan: PlanKey) {
    setLoadingPlan(plan)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: PLANS[plan].priceId }),
    })
    const data = await res.json().catch(() => ({}))
    setLoadingPlan(null)
    if (data.url) window.location.assign(data.url)
  }

  return (
    <div className="flex gap-2">
      {(Object.keys(PLANS) as PlanKey[]).map((plan) => (
        <Button
          key={plan}
          size="sm"
          variant={plan === 'premium' ? 'default' : 'outline'}
          onClick={() => handleUpgrade(plan)}
          disabled={loadingPlan !== null}
        >
          {loadingPlan === plan ? 'Redirecting…' : `${PLANS[plan].name} — $${PLANS[plan].price}/mo`}
        </Button>
      ))}
    </div>
  )
}
