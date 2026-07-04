'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet'

export function NewBrandButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pageName, setPageName] = useState('')
  const [pageId, setPageId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!pageName.trim()) return
    setLoading(true)
    setError(null)
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_name: pageName, page_id: pageId || undefined }),
    })
    setLoading(false)
    if (res.ok) {
      setPageName('')
      setPageId('')
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to add brand')
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" />}>
        <Plus className="w-4 h-4" />
        Track a brand
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Track a competitor brand</SheetTitle>
        </SheetHeader>
        <div className="px-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pageName">Page name</Label>
            <Input
              id="pageName"
              placeholder="e.g. Gymshark"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pageId">Meta Page ID (optional, more precise)</Label>
            <Input
              id="pageId"
              placeholder="1234567890"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <SheetFooter>
          <Button onClick={handleCreate} disabled={loading || !pageName.trim()}>
            {loading ? 'Adding…' : 'Add brand'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
