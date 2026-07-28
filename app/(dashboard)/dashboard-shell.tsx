'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

interface DashboardShellProps {
  children: React.ReactNode
  activeClinicId: string
  activeClinicName: string
  activeClinicLogo: string | null
}

export function DashboardShell({ children, activeClinicId, activeClinicName, activeClinicLogo }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden md:ml-[240px]">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          activeClinicId={activeClinicId}
          activeClinicName={activeClinicName}
        />
        <main className="flex-1 overflow-y-auto pt-16">
          {children}
        </main>
      </div>
    </div>
  )
}
