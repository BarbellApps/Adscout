'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet'

export function NewCollectionButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setLoading(false)
    if (res.ok) {
      setName('')
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" />}>
        <Plus className="w-4 h-4" />
        New collection
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New collection</SheetTitle>
        </SheetHeader>
        <div className="px-4">
          <Input
            placeholder="Collection name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>
        <SheetFooter>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
