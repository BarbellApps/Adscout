export type SubscriptionTier = 'free' | 'starter' | 'premium' | 'pro'
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due'
export type AdSource = 'graph_api' | 'manual_capture' | 'scraped'
export type AdPlatform = 'facebook' | 'instagram' | 'tiktok' | 'other'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  canvas_credits_remaining: number
  created_at: string
  updated_at: string
}

export interface Brand {
  id: string
  user_id: string
  page_name: string
  page_id: string | null
  platform: AdPlatform
  added_at: string
}

export interface Ad {
  id: string
  brand_id: string | null
  platform: AdPlatform
  headline: string | null
  body_copy: string | null
  media_url: string | null
  hook: string | null
  angle: string | null
  cta: string | null
  first_seen: string
  last_seen: string
  runtime_days: number
  source: AdSource
  created_at: string
}

export interface Template {
  id: string
  ad_id: string | null
  industry: string | null
  format: string | null
  canva_url: string | null
  figma_url: string | null
  created_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface CanvasProject {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface CanvasScriptVariation {
  hook: string
  angle: string
  body: string
  cta: string
}

export interface CanvasGeneration {
  id: string
  canvas_project_id: string
  model: string
  credits_used: number
  content: CanvasScriptVariation | null
  output_url: string | null
  created_at: string
}

export interface CanvasGenerationNote {
  id: string
  canvas_generation_id: string
  user_id: string
  body: string
  created_at: string
}
