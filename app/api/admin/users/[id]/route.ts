import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin'
import { TIER_LIMITS } from '@/lib/utils/gates'
import type { SubscriptionTier, SubscriptionStatus } from '@/types'

const VALID_TIERS: SubscriptionTier[] = ['free', 'starter', 'premium', 'pro']
const VALID_STATUSES: SubscriptionStatus[] = ['active', 'inactive', 'cancelled', 'past_due']

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}

  if (body.subscription_tier !== undefined) {
    if (!VALID_TIERS.includes(body.subscription_tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }
    update.subscription_tier = body.subscription_tier
    // When an admin changes tier, default status to active for a paid tier and
    // refill Canvas credits to that tier's monthly allotment — unless the
    // request also specifies these explicitly below.
    if (body.subscription_status === undefined) {
      update.subscription_status = body.subscription_tier === 'free' ? 'inactive' : 'active'
    }
    if (body.canvas_credits_remaining === undefined) {
      update.canvas_credits_remaining = TIER_LIMITS[body.subscription_tier as SubscriptionTier].canvas_credits_per_month
    }
  }

  if (body.subscription_status !== undefined) {
    if (!VALID_STATUSES.includes(body.subscription_status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    update.subscription_status = body.subscription_status
  }

  if (body.canvas_credits_remaining !== undefined) {
    const credits = Number(body.canvas_credits_remaining)
    if (!Number.isFinite(credits) || credits < 0) {
      return NextResponse.json({ error: 'Invalid credits' }, { status: 400 })
    }
    update.canvas_credits_remaining = Math.floor(credits)
  }

  if (body.is_admin !== undefined) {
    // Guard against an admin removing their own admin rights and locking
    // everyone out by accident.
    if (id === ctx.userId && body.is_admin === false) {
      return NextResponse.json({ error: 'You cannot remove your own admin access' }, { status: 400 })
    }
    update.is_admin = Boolean(body.is_admin)
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await ctx.admin
    .from('users')
    .update(update)
    .eq('id', id)
    .select('id, email, subscription_tier, subscription_status, canvas_credits_remaining, is_admin')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ user: data })
}
