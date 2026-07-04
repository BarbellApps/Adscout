import { BarChart3 } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your ad intelligence overview — tracked brands, saved templates, and recent Canvas activity
        </p>
      </div>
      <EmptyState
        icon={BarChart3}
        title="No activity yet"
        description="Add a brand to Scout, save a template, or start a Canvas project to see your overview here."
        action={{ label: 'Add a brand to Scout', href: '/scout' }}
      />
    </div>
  )
}
