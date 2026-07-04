'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RemoveAdButton({ collectionId, adId }: { collectionId: string; adId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    setLoading(true)
    await fetch(`/api/collections/${collectionId}/ads/${adId}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  return (
    <Button size="icon-sm" variant="ghost" onClick={handleRemove} disabled={loading}>
      <X className="w-3.5 h-3.5" />
    </Button>
  )
}
