import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validatePageId } from '@/lib/meta/graph-api'
import { isMetaGraphConfigured } from '@/lib/meta/config'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { page_id: pageId } = await req.json().catch(() => ({}))
  const trimmedPageId = typeof pageId === 'string' ? pageId.trim() : ''
  if (!trimmedPageId) {
    return NextResponse.json({ error: 'page_id is required' }, { status: 400 })
  }

  const pageIdError = await validatePageId(trimmedPageId, isMetaGraphConfigured())
  if (pageIdError) {
    return NextResponse.json({ error: pageIdError }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('brands')
    .update({ page_id: trimmedPageId })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, page_name, page_id, platform, added_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  return NextResponse.json({ brand: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
