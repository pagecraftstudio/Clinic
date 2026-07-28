'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Activity, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface Props {
  children: ReactNode
  clinicName?: string
  logoUrl?: string | null
  primaryColor?: string | null
}

export function PortalShell({ children, clinicName, logoUrl, primaryColor }: Props) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Apply primary_color from clinic settings as CSS variable
  useEffect(() => {
    if (primaryColor) {
      document.documentElement.style.setProperty('--accent', primaryColor)
      document.documentElement.style.setProperty('--accent-hover', primaryColor)
    }
  }, [primaryColor])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo + name */}
          <Link href="/portal" className="flex items-center gap-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
                <Activity size={14} color="white" />
              </div>
            )}
            <span style={{ fontSize: 15 }}>{clinicName ?? 'Patient Portal'}</span>
          </Link>

          {/* Nav */}
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

            {/* Dark mode toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="ml-1 w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--bg-subtle)]"
                style={{ color: 'var(--text-muted)' }}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            )}
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
