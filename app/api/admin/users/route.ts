import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin'

export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await ctx.admin
    .from('users')
    .select(
      'id, email, full_name, subscription_tier, subscription_status, canvas_credits_remaining, is_admin, stripe_customer_id, created_at, brands(count), collections(count), canvas_projects(count)'
    )
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: data })
}
