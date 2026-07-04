import { LayoutTemplate } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function TemplatesPage() {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Templates</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Ad Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          High-performing ad templates curated weekly from proven Meta ads. Open in Canva or Figma to customize.
        </p>
      </div>
      <EmptyState
        icon={LayoutTemplate}
        title="Template library coming soon"
        description="Browse 30+ day runtime, high-spend brand, and strong-hook templates by industry and format once the library is seeded."
        action={{ label: 'Browse templates' }}
      />
    </div>
  )
}
