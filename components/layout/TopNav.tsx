'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Bell, User, Search } from 'lucide-react'
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
}

export function TopNav({ user }: TopNavProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get('q')
    if (q) router.push(`/explore?q=${encodeURIComponent(q as string)}`)
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-[220px] z-40 h-14 flex items-center justify-between gap-4 px-4 sm:px-6"
      style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}
    >
      {/* Left: search */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#98A2B3' }} />
          <input
            name="q"
            type="text"
            placeholder="Search ads, brands, keywords..."
            className="w-full h-9 pl-9 pr-14 rounded-lg text-sm outline-none transition-colors"
            style={{ backgroundColor: '#F7F8FA', border: '1px solid #E5E7EB', color: '#111827' }}
          />
          <kbd
            className="hidden sm:flex items-center absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#98A2B3' }}
          >
            ⌘K
          </kbd>
        </div>
      </form>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: '#667085' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Bell className="w-[18px] h-[18px]" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={user?.avatar_url ?? ''} />
              <AvatarFallback
                className="text-xs font-medium"
                style={{ backgroundColor: '#EEF2FF', color: '#635BFF' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
          >
            <DropdownMenuItem className="text-xs opacity-60 cursor-default" disabled>
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ backgroundColor: '#E5E7EB' }} />
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="cursor-pointer text-sm"
              style={{ color: '#111827' }}
            >
              <User className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-sm"
              style={{ color: '#D64545' }}
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
