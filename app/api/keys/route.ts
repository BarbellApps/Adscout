import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateApiKeyPlaintext, hashApiKey } from '@/lib/api-keys'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, label, created_at, last_used_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ keys: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { label } = await req.json().catch(() => ({ label: undefined }))
  const plaintextKey = generateApiKeyPlaintext()

  const { error } = await supabase.from('api_keys').insert({
    user_id: user.id,
    key_hash: hashApiKey(plaintextKey),
    label: label || 'Chrome extension',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Plaintext key is returned exactly once — the client must display and
  // discard it. Only the hash is ever persisted.
  return NextResponse.json({ key: plaintextKey })
}
