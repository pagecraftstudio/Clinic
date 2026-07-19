'use client'

import { useReceptionStats } from '@/features/reception/hooks'
import {
  Calendar, UserCheck, Clock, CheckCircle2,
  XCircle, UserX, Users, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  color: string
  bg: string
}

function StatCard({ label, value, icon: Icon, color, bg }: StatCardProps) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--text-primary)] leading-none">{value}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export function ReceptionStats() {
  const { data: stats, isLoading } = useReceptionStats()

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-4 h-[72px] skeleton" />
        ))}
      </div>
    )
  }

  const cards: StatCardProps[] = [
    { label: 'Total Today',   value: stats.total,       icon: Calendar,     color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Scheduled',     value: stats.scheduled,   icon: Clock,        color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Confirmed',     value: stats.confirmed,   icon: TrendingUp,   color: '#0284C7', bg: '#F0F9FF' },
    { label: 'Checked In',    value: stats.checked_in,  icon: UserCheck,    color: '#059669', bg: '#ECFDF5' },
    { label: 'In Progress',   value: stats.in_progress, icon: Users,        color: '#D97706', bg: '#FFFBEB' },
    { label: 'Completed',     value: stats.completed,   icon: CheckCircle2, color: '#374151', bg: '#F3F4F6' },
    { label: 'Cancelled',     value: stats.cancelled,   icon: XCircle,      color: '#DC2626', bg: '#FEF2F2' },
    { label: 'New Patients',  value: stats.new_patients,icon: UserX,        color: '#7C3AED', bg: '#F5F3FF' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map(c => <StatCard key={c.label} {...c} />)}
    </div>
  )
}
