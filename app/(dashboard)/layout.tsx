import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { MobileNav } from '@/components/layout/MobileNav'
import type { User } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0B12' }}>
      <Sidebar />
      <TopNav user={user as User | null} />
      <main className="pt-14 pl-16 min-h-screen pb-20 lg:pb-0">
        <div className="p-6">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
