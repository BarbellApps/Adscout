'use client'

import { useEffect, useState } from 'react'
import { Plug, Copy, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ApiKeySummary {
  id: string
  label: string
  created_at: string
  last_used_at: string | null
}

export default function IntegrationsPage() {
  const [keys, setKeys] = useState<ApiKeySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  async function loadKeys() {
    const res = await fetch('/api/keys')
    if (res.ok) {
      const data = await res.json()
      setKeys(data.keys)
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    fetch('/api/keys')
      .then((res) => (res.ok ? res.json() : { keys: [] }))
      .then((data) => {
        if (!cancelled) {
          setKeys(data.keys ?? [])
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleGenerate() {
    setGenerating(true)
    const res = await fetch('/api/keys', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setNewKey(data.key)
      await loadKeys()
    }
    setGenerating(false)
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/keys/${id}`, { method: 'DELETE' })
    await loadKeys()
  }

  async function handleCopy() {
    if (!newKey) return
    await navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect the AdScout Chrome extension. Canva and Figma export are coming in a later phase.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="w-4 h-4" />
            Chrome extension
          </CardTitle>
          <CardDescription>
            Generate an API key, paste it into the extension&apos;s popup, then capture any ad
            you find while browsing straight into a Collection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {newKey && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Copy this key now — it won&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background rounded px-2 py-1.5 overflow-x-auto">{newKey}</code>
                <Button size="icon-sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generating} size="sm">
            {generating ? 'Generating…' : 'Generate new API key'}
          </Button>

          <div className="pt-2 space-y-2">
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading keys…</p>
            ) : keys.length === 0 ? (
              <p className="text-xs text-muted-foreground">No API keys yet.</p>
            ) : (
              keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between text-sm py-2 border-t border-border first:border-t-0">
                  <div>
                    <p className="text-foreground">{k.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(k.created_at).toLocaleDateString()}
                      {k.last_used_at ? ` · last used ${new Date(k.last_used_at).toLocaleDateString()}` : ' · never used'}
                    </p>
                  </div>
                  <Button size="icon-sm" variant="ghost" onClick={() => handleRevoke(k.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
