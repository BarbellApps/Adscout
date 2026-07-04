import { Plug } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function IntegrationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect Canva, Figma, and the AdScout Chrome extension
        </p>
      </div>
      <EmptyState
        icon={Plug}
        title="No integrations connected"
        description="Connect Canva or Figma to export templates, or install the Chrome extension to capture ads as you browse."
        action={{ label: 'Connect an integration' }}
      />
    </div>
  )
}
