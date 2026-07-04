export const PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    features: ['Templates library', 'Explore search', 'Collections', 'Chrome extension'],
  },
  premium: {
    name: 'Premium',
    price: 79,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: ['Everything in Starter', 'Scout (10 brands)', 'AI Canvas (500 credits/mo)'],
  },
  pro: {
    name: 'Pro',
    price: 129,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ['Everything in Premium', 'Scout (unlimited brands)', 'AI Canvas (700 credits/mo)'],
  },
} as const

export type PlanKey = keyof typeof PLANS
