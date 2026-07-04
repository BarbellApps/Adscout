'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Bell, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User as AppUser } from '@/types'

interface TopNavProps {
  user: AppUser | null
  title?: string
}

export function TopNav({ user, title = 'Dashboard' }: TopNavProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header
      className="fixed top-0 right-0 z-40 h-14 flex items-center justify-between px-6"
      style={{
        left: '64px',
        backgroundColor: '#0B0B12',
        borderBottom: '1px solid #26263A',
      }}
    >
      {/* Left: page title + version badge */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold" style={{ color: '#EDEDF5' }}>{title}</h2>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-widest font-mono"
          style={{ backgroundColor: '#1D1D2A', color: '#75758A', border: '1px solid #26263A' }}
        >
          Beta
        </span>
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-2">
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: '#75758A' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1D1D2A')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Bell className="w-4 h-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none">
            <Avatar className="h-7 w-7 cursor-pointer">
              <AvatarImage src={user?.avatar_url ?? ''} />
              <AvatarFallback
                className="text-xs font-medium"
                style={{ backgroundColor: '#8B5CF622', color: '#8B5CF6' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            style={{ backgroundColor: '#1D1D2A', border: '1px solid #26263A' }}
          >
            <DropdownMenuItem className="text-xs opacity-60 cursor-default" disabled>
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ backgroundColor: '#26263A' }} />
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="cursor-pointer text-sm"
              style={{ color: '#EDEDF5' }}
            >
              <User className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-sm"
              style={{ color: '#F87171' }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
