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
    <div className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <Sidebar isAdmin={Boolean((user as User | null)?.is_admin)} user={user as User | null} />
      <TopNav user={user as User | null} />
      <main className="pt-14 lg:pl-[220px] min-h-screen pb-20 lg:pb-0">
        <div className="max-w-[1500px] mx-auto p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
