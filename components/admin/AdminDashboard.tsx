'use client'

import { useEffect, useState } from 'react'
import { Users, CreditCard, Radar, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EditUserSheet } from '@/components/admin/EditUserSheet'
import type { SubscriptionTier } from '@/types'

export interface AdminUserRow {
  id: string
  email: string
  full_name: string | null
  subscription_tier: SubscriptionTier
  subscription_status: string
  canvas_credits_remaining: number
  is_admin: boolean
  stripe_customer_id: string | null
  created_at: string
  brands: { count: number }[]
  collections: { count: number }[]
  canvas_projects: { count: number }[]
}

interface Stats {
  total_users: number
  tier_counts: Record<SubscriptionTier, number>
  active_subscriptions: number
  total_brands: number
  total_ads: number
  total_collections: number
  total_canvas_generations: number
}

const tierBadge: Record<SubscriptionTier, 'default' | 'secondary' | 'outline'> = {
  free: 'outline',
  starter: 'secondary',
  premium: 'default',
  pro: 'default',
}

export function AdminDashboard() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminUserRow | null>(null)

  async function load() {
    const [uRes, sRes] = await Promise.all([
      fetch('/api/admin/users'),
      fetch('/api/admin/stats'),
    ])
    if (uRes.ok) setUsers((await uRes.json()).users)
    if (sRes.ok) setStats(await sRes.json())
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([fetch('/api/admin/users'), fetch('/api/admin/stats')]).then(async ([uRes, sRes]) => {
      if (cancelled) return
      if (uRes.ok) setUsers((await uRes.json()).users)
      if (sRes.ok) setStats(await sRes.json())
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const statCards = stats
    ? [
        { icon: Users, label: 'Users', value: stats.total_users, sub: `${stats.active_subscriptions} paid` },
        { icon: CreditCard, label: 'Paid subs', value: stats.active_subscriptions, sub: `${stats.tier_counts.pro} pro · ${stats.tier_counts.premium} premium` },
        { icon: Radar, label: 'Tracked brands', value: stats.total_brands, sub: `${stats.total_ads} ads synced` },
        { icon: Sparkles, label: 'Canvas generations', value: stats.total_canvas_generations, sub: `${stats.total_collections} collections` },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <s.icon className="w-4 h-4" />
                <span className="text-xs">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground font-mono">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Credits</th>
                  <th className="px-4 py-3 font-medium">Usage</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users yet.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{u.email}</span>
                          {u.is_admin && <Badge variant="outline">admin</Badge>}
                        </div>
                        {u.full_name && <span className="text-xs text-muted-foreground">{u.full_name}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={tierBadge[u.subscription_tier]}>{u.subscription_tier}</Badge>
                          <span className="text-xs text-muted-foreground">{u.subscription_status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">{u.canvas_credits_remaining}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.brands?.[0]?.count ?? 0} brands · {u.collections?.[0]?.count ?? 0} collections · {u.canvas_projects?.[0]?.count ?? 0} canvas
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="xs" variant="outline" onClick={() => setEditing(u)}>Edit</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <EditUserSheet
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}
