import type { ReactNode } from 'react'
import Link from 'next/link'
import { Activity } from 'lucide-react'

export default function PatientPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Minimal top nav */}
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Activity size={14} color="white" />
            </div>
            <span style={{ fontSize: 15 }}>Patient Portal</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/portal" className="px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-secondary)' }}>
              Home
            </Link>
            <Link href="/portal/appointments" className="px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-secondary)' }}>
              Appointments
            </Link>
            <Link href="/portal/bills" className="px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-[var(--bg-subtle)]" style={{ color: 'var(--text-secondary)' }}>
              Bills
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
