import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client: bypasses RLS. Server-only — never import from a
// client component. Used where a request is authenticated by something
// other than a Supabase user session (e.g. the Chrome extension's API key).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
