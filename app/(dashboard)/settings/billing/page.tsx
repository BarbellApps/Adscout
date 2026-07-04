import { CreditCard } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function BillingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription plan and Canvas credit usage
        </p>
      </div>
      <EmptyState
        icon={CreditCard}
        title="No active subscription"
        description="Choose Starter, Premium, or Pro to unlock Scout, Explore, and AI Canvas."
        action={{ label: 'View plans' }}
      />
    </div>
  )
}
