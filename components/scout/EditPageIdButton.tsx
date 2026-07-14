'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
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

export function EditPageIdButton({ brandId, pageName }: { brandId: string; pageName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pageId, setPageId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!pageId.trim()) return
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/brands/${brandId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_id: pageId }),
    })
    setLoading(false)
    if (res.ok) {
      setPageId('')
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save')
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="xs" variant="outline" />}>
        <Pencil className="w-3 h-3" />
        Add Page ID
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add a Meta Page ID</SheetTitle>
          <p className="text-xs text-muted-foreground">{pageName}</p>
        </SheetHeader>
        <div className="px-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pageId">Meta Page ID</Label>
            <Input
              id="pageId"
              placeholder="1234567890"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              Numbers only, found under the page&apos;s &quot;Page Transparency&quot; section on Facebook — search for {pageName} in the{' '}
              <a href="https://www.facebook.com/ads/library" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Meta Ad Library
              </a>, open the page, and look under About.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <SheetFooter>
          <Button onClick={handleSave} disabled={loading || !pageId.trim()}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
