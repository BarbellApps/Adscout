export interface CanvasGenerationInput {
  productDescription: string
  targetAudience?: string
  tone?: string
  variationCount: number
}

export function buildScriptGenerationPrompt(input: CanvasGenerationInput): string {
  const { productDescription, targetAudience, tone, variationCount } = input

  return `You are an expert direct-response ad creative strategist.

Product/offer: ${productDescription}
${targetAudience ? `Target audience: ${targetAudience}` : ''}
${tone ? `Tone: ${tone}` : ''}

Generate ${variationCount} distinct ad script concepts. Each must have a different hook and angle so the variations are genuinely different, not rephrasings of each other.

For each concept return JSON with: hook (the opening line, first 1-2 seconds), angle (the core creative strategy/positioning), body (30-60 second video script or static ad body copy), cta (call to action).

Return ONLY a valid JSON array of ${variationCount} objects. No markdown, no explanation, no code fences.`
}
