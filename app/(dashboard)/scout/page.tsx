import { Radar } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ScoutPage() {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Scout</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Competitor Scout</h1>
        <p className="text-sm text-muted-foreground mt-1">
          24/7 monitoring of tracked brands&apos; Meta ad accounts — hooks, angles, audiences, and scaling status.
        </p>
      </div>
      <EmptyState
        icon={Radar}
        title="No brands tracked yet"
        description="Add a competitor brand by name or Ad Library link to start monitoring their ad activity."
        action={{ label: 'Track a brand' }}
      />
    </div>
  )
}
