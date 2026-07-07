import { notFound } from 'next/navigation'
import { isCurrentUserAdmin } from '@/lib/admin'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  // Server-side gate. Non-admins get a 404 (not even an acknowledgement that
  // this route exists). Every /api/admin/* route re-checks independently.
  if (!(await isCurrentUserAdmin())) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage users, subscriptions, and Canvas credits across the workspace.
        </p>
      </div>
      <AdminDashboard />
    </div>
  )
}
