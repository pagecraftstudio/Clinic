'use client'
import { useState } from 'react'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

// Note: auth check must stay server-side — keep that in a parent server component
// or use middleware. This layout is now a client component to manage drawer state.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Main content shifts right only on md+ */}
      <div className="flex flex-1 flex-col overflow-hidden md:ml-[240px]">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex flex-col min-h-0 pt-16 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
