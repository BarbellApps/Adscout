import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { data, error } = await supabase
    .from('canvas_generation_notes')
    .select('id, canvas_generation_id, user_id, body, created_at')
    .eq('canvas_generation_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ notes: data })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { body } = await req.json()
  if (!body || typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'Note body is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('canvas_generation_notes')
    .insert({ canvas_generation_id: id, user_id: user.id, body: body.trim() })
    .select('id, canvas_generation_id, user_id, body, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ note: data })
}
