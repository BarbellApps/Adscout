import { getAnthropicClient, CANVAS_TEXT_MODEL } from '@/lib/anthropic/client'
import { enrichAdsPrompt } from '@/lib/anthropic/prompts/enrich'

export interface AdEnrichment {
  id: string
  hook: string
  angle: string
  cta: string
}

/**
 * Extracts hook/angle/CTA from real ad copy with Claude, one batched call.
 * Descriptive analysis of text we already have — not fabricated metrics.
 * Returns [] on any failure so sync itself never breaks on enrichment.
 */
export async function enrichAds(
  ads: { id: string; headline: string | null; body: string | null }[]
): Promise<AdEnrichment[]> {
  if (ads.length === 0) return []

  try {
    const client = getAnthropicClient()
    const response = await client.messages.create({
      model: CANVAS_TEXT_MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: enrichAdsPrompt(ads) }],
    })

    const text = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')

    const jsonStart = text.indexOf('[')
    const jsonEnd = text.lastIndexOf(']')
    if (jsonStart === -1 || jsonEnd === -1) return []

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as AdEnrichment[]
    const validIds = new Set(ads.map((a) => a.id))
    return parsed.filter((e) => e && validIds.has(e.id) && typeof e.hook === 'string')
  } catch {
    return []
  }
}
