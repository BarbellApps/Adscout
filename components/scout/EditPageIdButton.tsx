'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X } from 'lucide-react'
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
import { AdvertiserSearchField, type AdvertiserPage } from '@/components/scout/AdvertiserSearchField'

export function EditPageIdButton({ brandId, pageName }: { brandId: string; pageName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<AdvertiserPage | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [pageId, setPageId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setSelected(null)
    setManualMode(false)
    setPageId('')
    setError(null)
  }

  async function handleSave() {
    const id = manualMode ? pageId.trim() : selected?.page_id
    if (!id) return
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/brands/${brandId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_id: id }),
    })
    setLoading(false)
    if (res.ok) {
      reset()
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save')
    }
  }

  const canSubmit = manualMode ? Boolean(pageId.trim()) : Boolean(selected)

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
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
          {!manualMode ? (
            <div className="space-y-1.5">
              <Label>Search the Meta Ad Library</Label>
              {selected ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selected.page_name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">ID {selected.page_id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <AdvertiserSearchField onSelect={setSelected} placeholder={`Search for "${pageName}"`} />
              )}
              <button
                type="button"
                onClick={() => { setManualMode(true); setSelected(null) }}
                className="text-[11px] text-primary hover:underline"
              >
                Can&apos;t find it? Enter a Page ID manually
              </button>
            </div>
          ) : (
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
                Numbers only, found under the page&apos;s &quot;Page Transparency&quot; section on Facebook.
              </p>
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="text-[11px] text-primary hover:underline"
              >
                Search instead
              </button>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <SheetFooter>
          <Button onClick={handleSave} disabled={loading || !canSubmit}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
