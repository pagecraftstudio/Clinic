'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/settings/clinic',        label: 'Clinic' },
  { href: '/settings/users',         label: 'Users' },
  { href: '/settings/roles',         label: 'Roles & Permissions' },
  { href: '/settings/holidays',      label: 'Holidays' },
  { href: '/settings/notifications', label: 'Notifications' },
  { href: '/settings/invoice',       label: 'Invoice' },
]

export function SettingsNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 -mb-px">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap',
              active
                ? 'border-blue-500'
                : 'border-transparent hover:border-[var(--border-strong)]'
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
