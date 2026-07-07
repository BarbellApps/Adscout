import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAnthropicClient, CANVAS_TEXT_MODEL } from '@/lib/anthropic/client'
import { buildScriptGenerationPrompt } from '@/lib/anthropic/prompts/canvas'
import { TIER_LIMITS } from '@/lib/utils/gates'
import { CREDITS_PER_VARIATION, MAX_VARIATIONS_PER_REQUEST } from '@/lib/canvas'
import type { CanvasScriptVariation, SubscriptionTier } from '@/types'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.canvas_project_id || !body?.product_description) {
    return NextResponse.json({ error: 'canvas_project_id and product_description are required' }, { status: 400 })
  }

  const {
    canvas_project_id: canvasProjectId,
    product_description: productDescription,
    target_audience: targetAudience,
    tone,
  } = body as { canvas_project_id: string; product_description: string; target_audience?: string; tone?: string }

  const variationCount = Math.min(
    Math.max(Number(body.variation_count) || 3, 1),
    MAX_VARIATIONS_PER_REQUEST
  )

  const { data: project } = await supabase
    .from('canvas_projects')
    .select('id')
    .eq('id', canvasProjectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Canvas project not found' }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_tier, canvas_credits_remaining')
    .eq('id', user.id)
    .single()

  const tier = (profile?.subscription_tier ?? 'free') as SubscriptionTier
  if (TIER_LIMITS[tier].canvas_credits_per_month <= 0) {
    return NextResponse.json(
      { error: 'AI Canvas requires the Premium or Pro plan.' },
      { status: 403 }
    )
  }

  const creditsRemaining = profile?.canvas_credits_remaining ?? 0
  const cost = variationCount * CREDITS_PER_VARIATION
  if (creditsRemaining < cost) {
    return NextResponse.json(
      { error: `Not enough Canvas credits. This generation costs ${cost}, you have ${creditsRemaining}.` },
      { status: 402 }
    )
  }

  const prompt = buildScriptGenerationPrompt({ productDescription, targetAudience, tone, variationCount })

  let variations: CanvasScriptVariation[]
  try {
    const response = await getAnthropicClient().messages.create({
      model: CANVAS_TEXT_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from model')
    }
    variations = JSON.parse(textBlock.text)
    if (!Array.isArray(variations)) {
      throw new Error('Model did not return an array')
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Generation failed: ${err instanceof Error ? err.message : 'unknown error'}` },
      { status: 502 }
    )
  }

  const { data: generations, error: insertError } = await supabase
    .from('canvas_generations')
    .insert(
      variations.map((v) => ({
        canvas_project_id: canvasProjectId,
        model: CANVAS_TEXT_MODEL,
        credits_used: CREDITS_PER_VARIATION,
        content: v,
      }))
    )
    .select('id, model, credits_used, content, created_at')

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Best-effort deduction after the fact — generations are already saved by
  // this point, so a failure here under-charges rather than blocking output.
  // The users table is write-locked for the authenticated role (see migration
  // 001), so the balance update goes through the service-role admin client.
  const newBalance = creditsRemaining - cost
  const admin = createAdminClient()
  await admin.from('users').update({ canvas_credits_remaining: newBalance }).eq('id', user.id)
  await supabase.from('credit_ledger').insert({
    user_id: user.id,
    delta: -cost,
    reason: `canvas_generation:${canvasProjectId}`,
  })

  return NextResponse.json({ generations, credits_remaining: newBalance })
}
