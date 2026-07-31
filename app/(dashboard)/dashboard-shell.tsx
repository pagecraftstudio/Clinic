'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { MaintenanceBanner } from '@/components/shared/maintenance-banner'
import type { MaintenanceModeValue, SystemAnnouncement } from '@/types/admin'

interface DashboardShellProps {
  children: React.ReactNode
  activeClinicId: string
  activeClinicName: string
  activeClinicLogo: string | null
  activeClinicPrimaryColor?: string | null
  isSuperAdmin?: boolean
  maintenanceMode?: MaintenanceModeValue | null
  announcements?: SystemAnnouncement[]
}

export function DashboardShell({
  children, activeClinicId, activeClinicName, activeClinicLogo,
  activeClinicPrimaryColor, isSuperAdmin, maintenanceMode, announcements,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (activeClinicPrimaryColor) {
      document.documentElement.style.setProperty('--accent', activeClinicPrimaryColor)
      document.documentElement.style.setProperty('--accent-hover', activeClinicPrimaryColor)
    }
  }, [activeClinicPrimaryColor])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isSuperAdmin={isSuperAdmin} />
      <div className="flex flex-1 flex-col overflow-hidden md:ml-[240px]">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          activeClinicId={activeClinicId}
          activeClinicName={activeClinicName}
        />
        <main className="flex-1 overflow-y-auto pt-16">
          <MaintenanceBanner maintenanceMode={maintenanceMode} announcements={announcements} />
          {children}
        </main>
      </div>
    </div>
  )
}
