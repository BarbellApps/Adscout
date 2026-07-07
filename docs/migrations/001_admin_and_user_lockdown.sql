-- ============================================
-- Migration 001: Admin flag + users table lockdown
-- Run in Supabase SQL Editor (idempotent)
-- ============================================

-- 1. Admin flag
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Lock down the users table.
-- The original "Users: own row" policy was FOR ALL, which let an
-- authenticated user PATCH their own row via PostgREST — including
-- setting is_admin = true or subscription_tier = 'pro'. That's a
-- privilege-escalation hole. Replace it with SELECT-only for the
-- owner; all privileged writes (tier, status, credits, is_admin) go
-- through server routes using the service-role key, which bypasses RLS.
DROP POLICY IF EXISTS "Users: own row" ON public.users;

CREATE POLICY "Users: read own row" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Belt-and-suspenders: even the table grant should not allow writes from
-- the authenticated role (RLS already blocks it with no write policy, but
-- revoking the privilege makes the intent explicit and defense-in-depth).
REVOKE INSERT, UPDATE, DELETE ON public.users FROM authenticated;

-- The new-user trigger function is SECURITY DEFINER (runs as the table
-- owner), so signup inserts still work despite the revoke above.

-- 3. Bootstrap the initial admins.
UPDATE public.users SET is_admin = true
  WHERE email IN ('amirbarbell@gmail.com', 'onneheida@gmail.com');
