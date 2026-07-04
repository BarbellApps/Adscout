import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ExplorePage() {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Explore</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Explore Ads</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search live and historical ads by keyword, niche, format, or runtime.
        </p>
      </div>
      <EmptyState
        icon={Compass}
        title="Search the ad index"
        description="Enter a keyword, niche, or brand name to find proven ad concepts. The indexed corpus grows as Scout tracks more brands."
        action={{ label: 'Start exploring' }}
      />
    </div>
  )
}
