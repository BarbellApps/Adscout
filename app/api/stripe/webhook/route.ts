import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'
import type { PlanKey } from '@/lib/stripe/plans'
import { PLANS } from '@/lib/stripe/plans'

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

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (userId && session.customer && session.subscription) {
        await supabase
          .from('users')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: 'active',
          })
          .eq('id', userId)
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const priceId = subscription.items.data[0]?.price.id
      const status = subscription.status === 'active' ? 'active'
        : subscription.status === 'past_due' ? 'past_due'
        : event.type === 'customer.subscription.deleted' ? 'cancelled'
        : 'inactive'

      await supabase
        .from('users')
        .update({
          subscription_tier: tierFromPriceId(priceId),
          subscription_status: status,
        })
        .eq('stripe_customer_id', subscription.customer as string)
      break
    }
  }

  return NextResponse.json({ received: true })
}
