import { Bookmark } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function CollectionsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Collections</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Save ads from Scout, Explore, or the Chrome extension into shareable team boards.
        </p>
      </div>
      <EmptyState
        icon={Bookmark}
        title="No collections yet"
        description="Create a collection to start organizing saved ads for your team."
        action={{ label: 'Create a collection' }}
      />
    </div>
  )
}
