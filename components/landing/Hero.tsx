import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MockupCards } from './MockupCards'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(60% 50% at 50% 0%, #8B5CF622, transparent 70%)' }}
      />
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 relative">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono mb-6"
              style={{ backgroundColor: '#1D1D2A', border: '1px solid #26263A', color: '#A78BFA' }}
            >
              Ad creative intelligence
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5" style={{ color: '#EDEDF5' }}>
              Stop guessing what ads will work.
            </h1>
            <p className="text-lg mb-8 max-w-md" style={{ color: '#B4B4C4' }}>
              Track competitor ad accounts, search proven creative concepts, and generate new ad
              scripts with Claude — one workspace, from research to production.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/signup">
                <Button size="lg">Get started</Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">See how it works</Button>
              </a>
            </div>
          </div>

          <MockupCards />
        </div>
      </div>
    </section>
  )
}
