import Link from 'next/link'
import { Radar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #26263A' }}>
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4" style={{ color: '#EDEDF5' }}>
          Ready to see what&apos;s actually working?
        </h2>
        <Link href="/signup">
          <Button size="lg">Get started</Button>
        </Link>
      </div>
      <div className="max-w-6xl mx-auto px-6 pb-10 flex items-center justify-between" style={{ borderTop: '1px solid #26263A', paddingTop: '2rem' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
            <Radar className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium" style={{ color: '#EDEDF5' }}>AdScout</span>
        </div>
        <p className="text-xs" style={{ color: '#75758A' }}>&copy; {new Date().getFullYear()} AdScout</p>
      </div>
    </footer>
  )
}
