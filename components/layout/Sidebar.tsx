'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  LayoutTemplate,
  Radar,
  Compass,
  Bookmark,
  Sparkles,
  Settings,
  Shield,
} from 'lucide-react'
import { TIER_LIMITS } from '@/lib/utils/gates'
import type { SubscriptionTier, User } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: typeof BarChart3
}

const discoverItems: NavItem[] = [
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/scout', label: 'Scout', icon: Radar },
]

const organizeItems: NavItem[] = [
  { href: '/collections', label: 'Collections', icon: Bookmark },
]

const createItems: NavItem[] = [
  { href: '/canvas', label: 'AI Canvas', icon: Sparkles },
]

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
        color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
      }}
      onMouseEnter={e => {
        if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sidebar-bg-secondary)'
      }}
      onMouseLeave={e => {
        if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
      }}
    >
      <item.icon className="w-4 h-4 shrink-0" style={{ color: isActive ? '#8B85FF' : 'inherit' }} />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="px-2.5 mt-5 mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
      style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}
    >
      {children}
    </p>
  )
}

export function Sidebar({ isAdmin = false, user = null }: { isAdmin?: boolean; user?: User | null }) {
  const pathname = usePathname()

  const tier = (user?.subscription_tier ?? 'free') as SubscriptionTier
  const creditsTotal = TIER_LIMITS[tier].canvas_credits_per_month
  const creditsRemaining = user?.canvas_credits_remaining ?? 0
  const creditsPct = creditsTotal > 0 ? Math.max(0, Math.min(100, (creditsRemaining / creditsTotal) * 100)) : 0

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <aside
      className="fixed left-0 top-0 h-full hidden lg:flex flex-col z-50"
      style={{ width: '220px', backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#635BFF' }}>
          <Radar className="w-4 h-4 text-white" />
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--sidebar-text-active)' }}>AdScout</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-3">
        <div className="mt-3">
          <NavLink item={{ href: '/dashboard', label: 'Dashboard', icon: BarChart3 }} isActive={pathname === '/dashboard'} />
        </div>

        <SectionLabel>Discover</SectionLabel>
        <div className="space-y-0.5">
          {discoverItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={pathname === item.href || pathname.startsWith(item.href + '/')} />
          ))}
        </div>

        <SectionLabel>Organize</SectionLabel>
        <div className="space-y-0.5">
          {organizeItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={pathname === item.href || pathname.startsWith(item.href + '/')} />
          ))}
        </div>

        <SectionLabel>Create</SectionLabel>
        <div className="space-y-0.5">
          {createItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={pathname === item.href || pathname.startsWith(item.href + '/')} />
          ))}
        </div>
      </nav>

      {/* AI Credits widget */}
      {tier !== 'free' && (
        <div className="mx-2.5 mb-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--sidebar-bg-secondary)', border: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium" style={{ color: 'var(--sidebar-text)' }}>AI Credits</span>
            <span className="text-[11px] font-mono" style={{ color: 'var(--sidebar-text-active)' }}>{creditsRemaining}/{creditsTotal}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{ width: `${creditsPct}%`, backgroundColor: '#635BFF' }} />
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className="px-2.5 pb-2.5 space-y-0.5" style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: '10px' }}>
        {isAdmin && (
          <NavLink item={{ href: '/admin', label: 'Admin', icon: Shield }} isActive={pathname === '/admin'} />
        )}
        <NavLink item={{ href: '/settings', label: 'Settings', icon: Settings }} isActive={pathname.startsWith('/settings')} />
      </div>

      {/* User profile footer */}
      <Link
        href="/settings"
        className="flex items-center gap-2.5 px-3 py-3 shrink-0 transition-colors"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--sidebar-bg-secondary)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold"
          style={{ backgroundColor: '#635BFF33', color: '#8B85FF' }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--sidebar-text-active)' }}>
            {user?.full_name ?? 'Account'}
          </p>
          <p className="text-[11px] truncate" style={{ color: 'var(--sidebar-text)' }}>{user?.email}</p>
        </div>
      </Link>
    </aside>
  )
}
