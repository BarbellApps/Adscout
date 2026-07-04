import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; adId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, adId } = await params

  // Ownership is enforced by RLS (collection_ads policy checks the parent
  // collection's user_id), so this delete is a no-op for collections you
  // don't own rather than an error.
  const { error } = await supabase
    .from('collection_ads')
    .delete()
    .eq('collection_id', id)
    .eq('ad_id', adId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
