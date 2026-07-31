import type { ReactNode } from 'react'
import { requireSuperAdmin } from '@/lib/admin-context'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSuperAdmin()

  return (
    <div className="flex flex-col gap-0">
      <div className="px-6 pt-6 pb-0 border-b border-[var(--border)]">
        <div className="mb-4">
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Super Admin
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Platform-wide management across all clinics
          </p>
        </div>
        <AdminNav />
      </div>
      <div className="flex-1 p-6">{children}</div>
    </div>
  )
}
