import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'
import type { PlanKey } from '@/lib/stripe/plans'
import { PLANS } from '@/lib/stripe/plans'
import { TIER_LIMITS } from '@/lib/utils/gates'

function tierFromPriceId(priceId: string | undefined): PlanKey | 'free' {
  const entry = (Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][])
    .find(([, plan]) => plan.priceId === priceId)
  return entry ? entry[0] : 'free'
}

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // The Stripe signature check above is the trust boundary for this route —
  // there is no logged-in user session, so a cookie-scoped client (subject
  // to RLS) can never see or update other users' rows here.
  const admin = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (userId && session.customer && session.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(session.subscription as string)
        const tier = tierFromPriceId(subscription.items.data[0]?.price.id)
        await admin
          .from('users')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: 'active',
            subscription_tier: tier,
            canvas_credits_remaining: TIER_LIMITS[tier].canvas_credits_per_month,
          })
          .eq('id', userId)
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const priceId = subscription.items.data[0]?.price.id
      const tier = tierFromPriceId(priceId)
      const status = subscription.status === 'active' ? 'active'
        : subscription.status === 'past_due' ? 'past_due'
        : event.type === 'customer.subscription.deleted' ? 'cancelled'
        : 'inactive'

      await admin
        .from('users')
        .update({
          subscription_tier: tier,
          subscription_status: status,
          canvas_credits_remaining: TIER_LIMITS[tier].canvas_credits_per_month,
        })
        .eq('stripe_customer_id', subscription.customer as string)
      break
    }
  }

  return NextResponse.json({ received: true })
}
