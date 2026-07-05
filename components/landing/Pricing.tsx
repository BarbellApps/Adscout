import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLANS, type PlanKey } from '@/lib/stripe/plans'

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28" style={{ borderTop: '1px solid #26263A' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-14">
          <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ color: '#EDEDF5' }}>
            Simple pricing
          </h2>
          <p className="text-base" style={{ color: '#B4B4C4' }}>
            No free trial — just a plan that fits how much of the workflow you need.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => {
            const plan = PLANS[key]
            const highlighted = key === 'premium'
            return (
              <div
                key={key}
                className="rounded-2xl p-6 flex flex-col"
                style={{
                  backgroundColor: highlighted ? '#1D1D2A' : '#14141E',
                  border: highlighted ? '1px solid #8B5CF6' : '1px solid #26263A',
                }}
              >
                {highlighted && (
                  <span className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#A78BFA' }}>
                    Most popular
                  </span>
                )}
                <h3 className="text-base font-semibold mb-1" style={{ color: '#EDEDF5' }}>{plan.name}</h3>
                <div className="mb-5">
                  <span className="text-3xl font-bold" style={{ color: '#EDEDF5' }}>${plan.price}</span>
                  <span className="text-sm" style={{ color: '#75758A' }}> /month</span>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm" style={{ color: '#B4B4C4' }}>
                      <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#8B5CF6' }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button className="w-full" variant={highlighted ? 'default' : 'outline'}>
                    Get started
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
