import type { ReactNode } from 'react'
import { requireSuperAdmin } from '@/lib/admin-context'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSuperAdmin()

  return (
    <div className="flex flex-col gap-0">
      <div className="px-6 pt-6 pb-0 border-b border-white/[0.06]">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-white tracking-tight">Super Admin</h1>
          <p className="text-sm text-[#A1A8B8] mt-0.5">Platform-wide management across all clinics</p>
        </div>
        <AdminNav />
      </div>
      <div className="flex-1 p-6">{children}</div>
    </div>
  )
}
