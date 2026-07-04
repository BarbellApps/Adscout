import { Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function CanvasPage() {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Canvas</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">AI Canvas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate ad scripts and static ad variations with Claude and other AI models. Credits reset monthly.
        </p>
      </div>
      <EmptyState
        icon={Sparkles}
        title="Start your first Canvas project"
        description="Import a competitor ad or product photo, pick a model, and generate ad variations with your team."
        action={{ label: 'New Canvas project' }}
      />
    </div>
  )
}
