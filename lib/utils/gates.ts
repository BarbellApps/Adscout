export const TIER_LIMITS = {
  free: {
    templates: false,
    explore: false,
    collections: false,
    chrome_extension: false,
    scout_brand_limit: 0,
    canvas_credits_per_month: 0,
  },
  starter: {
    templates: true,
    explore: true,
    collections: true,
    chrome_extension: true,
    scout_brand_limit: 0,
    canvas_credits_per_month: 0,
  },
  premium: {
    templates: true,
    explore: true,
    collections: true,
    chrome_extension: true,
    scout_brand_limit: 10,
    canvas_credits_per_month: 500,
  },
  pro: {
    templates: true,
    explore: true,
    collections: true,
    chrome_extension: true,
    scout_brand_limit: -1,
    canvas_credits_per_month: 700,
  },
} as const

export type TierLimits = (typeof TIER_LIMITS)[keyof typeof TIER_LIMITS]
