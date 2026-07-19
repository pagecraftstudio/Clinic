'use client'

import Link from 'next/link'
import { UserPlus, CalendarPlus, Receipt, Search } from 'lucide-react'

const ACTIONS = [
  {
    label: 'New Patient',
    description: 'Register a new patient',
    icon: UserPlus,
    href: '/patients/new',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    label: 'Book Appointment',
    description: 'Schedule a new appointment',
    icon: CalendarPlus,
    href: '/appointments/new',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    label: 'New Invoice',
    description: 'Create a billing invoice',
    icon: Receipt,
    href: '/billing/new',
    color: '#059669',
    bg: '#ECFDF5',
  },
  {
    label: 'Find Patient',
    description: 'Search patient records',
    icon: Search,
    href: '/patients',
    color: '#D97706',
    bg: '#FFFBEB',
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ACTIONS.map(({ label, description, icon: Icon, href, color, bg }) => (
        <Link
          key={href}
          href={href}
          className="card p-4 flex items-start gap-3 hover:shadow-md transition-all hover:-translate-y-0.5 group"
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: bg }}
          >
            <Icon size={18} style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
              {label}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-tight">{description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
