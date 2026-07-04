'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SyncBrandButton({ brandId }: { brandId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setMessage(null)
    const res = await fetch('/api/scout/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_id: brandId }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    setMessage(res.ok ? `Synced ${data.synced} ads` : data.error ?? 'Sync failed')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="icon-sm" variant="outline" onClick={handleSync} disabled={loading}>
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      </Button>
      {message && <span className="text-xs text-muted-foreground">{message}</span>}
    </div>
  )
}
