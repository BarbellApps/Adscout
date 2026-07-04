'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function RemoveBrandButton({ brandId }: { brandId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    setLoading(true)
    await fetch(`/api/brands/${brandId}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="text-muted-foreground hover:text-destructive disabled:opacity-50"
      title="Remove"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
