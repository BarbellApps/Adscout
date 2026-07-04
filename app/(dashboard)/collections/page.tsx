import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { NewCollectionButton } from '@/components/collections/NewCollectionButton'
import { createClient } from '@/lib/supabase/server'

interface CollectionRow {
  id: string
  name: string
  created_at: string
  collection_ads: { count: number }[]
}

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: collections } = user
    ? await supabase
        .from('collections')
        .select('id, name, created_at, collection_ads(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const rows = (collections ?? []) as unknown as CollectionRow[]

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Save ads from Scout, Explore, or the Chrome extension into shareable team boards.
          </p>
        </div>
        <NewCollectionButton />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No collections yet"
          description="Create a collection to start organizing saved ads for your team."
          action={{ label: 'Create a collection' }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((c) => (
            <Link key={c.id} href={`/collections/${c.id}`}>
              <Card className="hover:ring-primary/40 transition-shadow">
                <CardContent>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.collection_ads?.[0]?.count ?? 0} ads
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
