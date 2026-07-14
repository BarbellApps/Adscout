import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchAdvertiserPages } from '@/lib/meta/graph-api'
import { isMetaGraphConfigured } from '@/lib/meta/config'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isMetaGraphConfigured()) {
    return NextResponse.json({ error: 'Meta Ad Library API is not configured.' }, { status: 503 })
  }

  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ pages: [] })
  }

  try {
    const pages = await searchAdvertiserPages(q)
    return NextResponse.json({ pages })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Meta Graph API request failed' },
      { status: 502 }
    )
  }
}
