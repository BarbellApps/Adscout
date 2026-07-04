'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MAX_VARIATIONS_PER_REQUEST, CREDITS_PER_VARIATION } from '@/lib/canvas'

export function GenerateForm({ canvasProjectId }: { canvasProjectId: string }) {
  const router = useRouter()
  const [productDescription, setProductDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [tone, setTone] = useState('')
  const [variationCount, setVariationCount] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productDescription.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/canvas/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canvas_project_id: canvasProjectId,
        product_description: productDescription,
        target_audience: targetAudience || undefined,
        tone: tone || undefined,
        variation_count: variationCount,
      }),
    })

    if (res.ok) {
      setProductDescription('')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Generation failed')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="space-y-1.5">
        <Label htmlFor="product">Product / offer</Label>
        <textarea
          id="product"
          className="w-full min-h-20 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="A magnesium sleep supplement for people who wake up at 3am"
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="audience">Target audience (optional)</Label>
          <Input
            id="audience"
            placeholder="Women 30-45, wellness-focused"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tone">Tone (optional)</Label>
          <Input
            id="tone"
            placeholder="Direct, no-fluff"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="variations">Variations ({variationCount * CREDITS_PER_VARIATION} credits)</Label>
        <Input
          id="variations"
          type="number"
          min={1}
          max={MAX_VARIATIONS_PER_REQUEST}
          value={variationCount}
          onChange={(e) => setVariationCount(Number(e.target.value))}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        <Sparkles className="w-4 h-4" />
        {loading ? 'Generating…' : 'Generate scripts'}
      </Button>
    </form>
  )
}
