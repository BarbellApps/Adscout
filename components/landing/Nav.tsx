import Link from 'next/link'
import { Radar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md" style={{ backgroundColor: '#0B0B12CC', borderBottom: '1px solid #26263A' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
            <Radar className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold" style={{ color: '#EDEDF5' }}>AdScout</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm transition-colors hover:text-foreground" style={{ color: '#B4B4C4' }}>Features</a>
          <a href="#how-it-works" className="text-sm transition-colors hover:text-foreground" style={{ color: '#B4B4C4' }}>How it works</a>
          <a href="#pricing" className="text-sm transition-colors hover:text-foreground" style={{ color: '#B4B4C4' }}>Pricing</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
