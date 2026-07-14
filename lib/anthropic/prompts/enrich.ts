export const enrichAdsPrompt = (ads: { id: string; headline: string | null; body: string | null }[]) => `
You are an expert ad creative analyst. For each ad below, extract:
- "hook": the attention-grabbing opening idea, paraphrased short (max 8 words, in the ad's own language)
- "angle": the persuasion angle as a short label in English (e.g. "Social proof", "Problem/solution", "Discreet design", "Urgency", "Lifestyle aspiration")
- "cta": the call to action implied or stated (short, e.g. "Shop now", "Pre-order")

Ads:
${ads.map((a) => `ID ${a.id}\nHeadline: ${a.headline ?? '(none)'}\nBody: ${a.body ?? '(none)'}`).join('\n---\n')}

Return ONLY a valid JSON array like:
[{"id": "...", "hook": "...", "angle": "...", "cta": "..."}]
No markdown fences, no explanation.
`
