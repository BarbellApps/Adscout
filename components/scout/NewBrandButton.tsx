'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
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

export function NewBrandButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<AdvertiserPage | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [pageName, setPageName] = useState('')
  const [pageId, setPageId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setSelected(null)
    setManualMode(false)
    setPageName('')
    setPageId('')
    setError(null)
  }

  async function handleCreate() {
    const body = manualMode
      ? { page_name: pageName, page_id: pageId }
      : selected
        ? { page_name: selected.page_name, page_id: selected.page_id }
        : null
    if (!body || !body.page_name.trim() || !body.page_id.trim()) return

    setLoading(true)
    setError(null)
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (res.ok) {
      reset()
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to add brand')
    }
  }

  const canSubmit = manualMode ? Boolean(pageName.trim() && pageId.trim()) : Boolean(selected)

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <SheetTrigger render={<Button size="sm" />}>
        <Plus className="w-4 h-4" />
        Track a brand
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Track a competitor brand</SheetTitle>
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
                <AdvertiserSearchField onSelect={setSelected} />
              )}
              <p className="text-[11px] text-muted-foreground">
                Type a brand name and pick the exact business from the Ad Library — this gets the real Page ID directly, no manual lookup needed.
              </p>
              <button
                type="button"
                onClick={() => { setManualMode(true); setSelected(null) }}
                className="text-[11px] text-primary hover:underline"
              >
                Can&apos;t find it? Enter a Page ID manually
              </button>
            </div>
          ) : (
            <>
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
                <Label htmlFor="pageId">Meta Page ID</Label>
                <Input
                  id="pageId"
                  placeholder="1234567890"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Numbers only, found under the page&apos;s &quot;Page Transparency&quot; section on Facebook.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="text-[11px] text-primary hover:underline"
              >
                Search instead
              </button>
            </>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <SheetFooter>
          <Button onClick={handleCreate} disabled={loading || !canSubmit}>
            {loading ? 'Adding…' : 'Add brand'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
