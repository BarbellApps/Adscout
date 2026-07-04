'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { CanvasGeneration, CanvasGenerationNote } from '@/types'

export function GenerationCard({
  generation,
  initialNotes,
}: {
  generation: CanvasGeneration
  initialNotes: CanvasGenerationNote[]
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [draft, setDraft] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`generation-notes-${generation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'canvas_generation_notes',
          filter: `canvas_generation_id=eq.${generation.id}`,
        },
        (payload) => {
          const incoming = payload.new as CanvasGenerationNote
          setNotes((prev) => (prev.some((n) => n.id === incoming.id) ? prev : [...prev, incoming]))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [generation.id])

  async function handleAddNote() {
    if (!draft.trim()) return
    const body = draft
    setDraft('')
    await fetch(`/api/canvas/generations/${generation.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
  }

  const content = generation.content

  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{generation.model}</Badge>
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {notes.length}
          </button>
        </div>

        {content ? (
          <>
            <p className="text-sm font-medium text-foreground">{content.hook}</p>
            <p className="text-xs text-muted-foreground italic">{content.angle}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line">{content.body}</p>
            <p className="text-xs font-medium text-primary">{content.cta}</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No content</p>
        )}

        {showNotes && (
          <div className="pt-2 border-t border-border space-y-2">
            {notes.map((n) => (
              <p key={n.id} className="text-xs text-muted-foreground">{n.body}</p>
            ))}
            <div className="flex items-center gap-1.5">
              <Input
                placeholder="Leave a note for your team…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <Button size="icon-sm" onClick={handleAddNote}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
