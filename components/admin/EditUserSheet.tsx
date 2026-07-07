'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import type { AdminUserRow } from '@/components/admin/AdminDashboard'
import type { SubscriptionTier, SubscriptionStatus } from '@/types'

const TIERS: SubscriptionTier[] = ['free', 'starter', 'premium', 'pro']
const STATUSES: SubscriptionStatus[] = ['active', 'inactive', 'cancelled', 'past_due']

const selectStyle = {
  backgroundColor: '#0B0B12',
  border: '1px solid #26263A',
  color: '#EDEDF5',
}

export function EditUserSheet({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUserRow
  onClose: () => void
  onSaved: () => void
}) {
  const [tier, setTier] = useState<SubscriptionTier>(user.subscription_tier)
  const [status, setStatus] = useState<SubscriptionStatus>(user.subscription_status as SubscriptionStatus)
  const [credits, setCredits] = useState<number>(user.canvas_credits_remaining)
  const [isAdmin, setIsAdmin] = useState<boolean>(user.is_admin)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription_tier: tier,
        subscription_status: status,
        canvas_credits_remaining: credits,
        is_admin: isAdmin,
      }),
    })
    if (res.ok) {
      onSaved()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit user</SheetTitle>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </SheetHeader>

        <div className="px-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tier">Plan</Label>
            <select
              id="tier"
              value={tier}
              onChange={(e) => setTier(e.target.value as SubscriptionTier)}
              className="w-full h-8 rounded-lg px-2.5 text-sm outline-none"
              style={selectStyle}
            >
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Changing the plan also resets status and Canvas credits below to that plan&apos;s defaults — adjust after if needed.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
              className="w-full h-8 rounded-lg px-2.5 text-sm outline-none"
              style={selectStyle}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="credits">Canvas credits</Label>
            <Input
              id="credits"
              type="number"
              min={0}
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#EDEDF5' }}>
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              style={{ accentColor: '#8B5CF6' }}
            />
            Admin access
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
