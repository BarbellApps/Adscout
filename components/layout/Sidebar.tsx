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
  HelpCircle,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/scout', label: 'Scout', icon: Radar },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/collections', label: 'Collections', icon: Bookmark },
  { href: '/canvas', label: 'Canvas', icon: Sparkles },
]

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-16 hover:w-60 transition-all duration-200 ease-in-out z-50 flex flex-col py-4 px-2 group"
      style={{ backgroundColor: '#1D1D2A', borderRight: '1px solid #26263A' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-6 px-1 overflow-hidden">
        <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#8B5CF6' }}>
          <Radar className="w-4 h-4 text-white" />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
          <p className="text-sm font-semibold leading-none" style={{ color: '#EDEDF5' }}>AdScout</p>
          <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: '#75758A' }}>Ad Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 overflow-hidden',
                isActive
                  ? 'text-white'
                  : 'hover:text-white'
              )}
              style={{
                backgroundColor: isActive ? '#3a2f5c' : 'transparent',
                color: isActive ? '#EDEDF5' : '#75758A',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#262636'
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
              }}
            >
              <item.icon className="w-5 h-5 shrink-0" style={{ color: isActive ? '#8B5CF6' : 'inherit' }} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 pt-3" style={{ borderTop: '1px solid #26263A33' }}>
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 overflow-hidden"
            style={{
              backgroundColor: pathname === '/admin' ? '#3a2f5c' : 'transparent',
              color: pathname === '/admin' ? '#EDEDF5' : '#75758A',
            }}
            onMouseEnter={e => {
              if (pathname !== '/admin') (e.currentTarget as HTMLElement).style.backgroundColor = '#262636'
            }}
            onMouseLeave={e => {
              if (pathname !== '/admin') (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
            }}
          >
            <Shield className="w-5 h-5 shrink-0" style={{ color: pathname === '/admin' ? '#8B5CF6' : 'inherit' }} />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium">Admin</span>
          </Link>
        )}
        <Link
          href="/settings"
          className="flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 overflow-hidden"
          style={{ color: '#75758A' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#262636'
            ;(e.currentTarget as HTMLElement).style.color = '#EDEDF5'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = '#75758A'
          }}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium">Settings</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 overflow-hidden"
          style={{ color: '#75758A' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#262636'
            ;(e.currentTarget as HTMLElement).style.color = '#EDEDF5'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = '#75758A'
          }}
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium">Support</span>
        </Link>
      </div>
    </aside>
  )
}
