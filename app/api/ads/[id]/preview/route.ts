import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Redirects to the Meta ad snapshot render URL for an ad the caller can
 * access. The snapshot URL embeds our Graph API token (Meta puts it in the
 * URL itself), so it must never be printed in page HTML — pages iframe this
 * route instead, and only authenticated users get the redirect.
 */
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
  // RLS scopes this to ads the user can see (their brands' ads).
  const { data: ad } = await supabase
    .from('ads')
    .select('media_url')
    .eq('id', id)
    .single()

  if (!ad?.media_url) {
    return NextResponse.json({ error: 'No preview available' }, { status: 404 })
  }

  return NextResponse.redirect(ad.media_url, 302)
}
