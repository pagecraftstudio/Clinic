'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/admin',              label: 'Overview' },
  { href: '/admin/clinics',      label: 'Clinics' },
  { href: '/admin/flags',        label: 'Feature Flags' },
  { href: '/admin/announcements', label: 'Announcements' },
  { href: '/admin/audit',        label: 'Audit Log' },
  { href: '/admin/settings',     label: 'Platform Settings' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 -mb-px overflow-x-auto">
      {TABS.map((tab) => {
        const active = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap',
              active ? 'border-[var(--accent)]' : 'border-transparent hover:border-[var(--border-strong)]'
            )}
            style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
