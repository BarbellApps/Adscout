'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Radar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    const callbackError = searchParams.get('error')
    if (callbackError) {
      setError(decodeURIComponent(callbackError.replace(/\+/g, ' ')))
    }
  }, [searchParams])

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) return

    fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    })
      .then((res) => res.json())
      .then((settings) => setGoogleEnabled(Boolean(settings.external?.google)))
      .catch(() => setGoogleEnabled(false))
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleLogin() {
    if (!googleEnabled) {
      setError('Google sign-in is not enabled yet. Use email/password or ask an admin to enable Google in Supabase.')
      return
    }

    setGoogleLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email above, then click Forgot password.')
      return
    }

    setError(null)
    setResetSent(false)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    })
    if (error) {
      setError(error.message)
      return
    }
    setResetSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0B0B12' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
            <Radar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-none" style={{ color: '#EDEDF5' }}>AdScout</p>
            <p className="text-[10px] uppercase tracking-widest mt-0.5 font-mono" style={{ color: '#75758A' }}>Ad Intelligence</p>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: '#14141E', border: '1px solid #26263A' }}>
          <h1 className="text-lg font-semibold mb-1" style={{ color: '#EDEDF5' }}>Sign in</h1>
          <p className="text-sm mb-6" style={{ color: '#75758A' }}>Access your ad intelligence workspace</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-widest font-mono" style={{ color: '#75758A' }}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-md text-sm outline-none transition-colors"
                style={{
                  backgroundColor: '#0B0B12',
                  border: '1px solid #26263A',
                  color: '#EDEDF5',
                }}
                onFocus={e => (e.target.style.borderColor = '#8B5CF6')}
                onBlur={e => (e.target.style.borderColor = '#26263A')}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-widest font-mono" style={{ color: '#75758A' }}>Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs hover:underline"
                  style={{ color: '#8B5CF6' }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-md text-sm outline-none transition-colors"
                style={{
                  backgroundColor: '#0B0B12',
                  border: '1px solid #26263A',
                  color: '#EDEDF5',
                }}
                onFocus={e => (e.target.style.borderColor = '#8B5CF6')}
                onBlur={e => (e.target.style.borderColor = '#26263A')}
              />
            </div>

            {error && (
              <p className="text-xs py-2 px-3 rounded-md" style={{ backgroundColor: '#F8717111', color: '#F87171' }}>
                {error}
              </p>
            )}

            {resetSent && (
              <p className="text-xs py-2 px-3 rounded-md" style={{ backgroundColor: '#34D39911', color: '#34D399' }}>
                Password reset email sent to {email}.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md text-sm font-medium transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#8B5CF6', color: '#ffffff' }}
            >
              {loading ? 'Authenticating…' : 'Sign in'}
            </button>
          </form>

          {googleEnabled !== false && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full" style={{ borderTop: '1px solid #26263A' }} />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 text-xs font-mono" style={{ backgroundColor: '#14141E', color: '#75758A' }}>OR</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || googleEnabled === null}
                className="w-full py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-60"
                style={{ backgroundColor: 'transparent', border: '1px solid #26263A', color: '#EDEDF5' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1D1D2A')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {googleLoading ? 'Redirecting…' : 'Continue with Google'}
              </button>
            </>
          )}

          {googleEnabled === false && (
            <p className="text-xs mt-4 text-center" style={{ color: '#75758A' }}>
              Google sign-in is not configured on this project yet.
            </p>
          )}
        </div>

        <p className="text-center text-sm mt-4" style={{ color: '#75758A' }}>
          No account?{' '}
          <Link href="/signup" className="hover:underline" style={{ color: '#8B5CF6' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
