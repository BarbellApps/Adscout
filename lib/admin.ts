import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AdminContext {
  userId: string
  admin: SupabaseClient
}

/**
 * Returns an admin context if the current session belongs to an admin user,
 * or null otherwise. The is_admin check reads the caller's OWN row (allowed
 * by the "read own row" RLS policy). Data access for admin operations uses
 * the returned service-role client, which bypasses RLS — so every admin API
 * route must call this and bail on null before touching other users' data.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return null

  return { userId: user.id, admin: createAdminClient() }
}

/** True if the current session user is an admin (for server components / gating). */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return Boolean(profile?.is_admin)
}
