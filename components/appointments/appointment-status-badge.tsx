import { cn } from '@/lib/utils'
import type { AppointmentStatus } from '@/types/appointment'

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; classes: string; dot: string }> = {
  scheduled:   { label: 'Scheduled',   classes: 'bg-indigo-50 text-indigo-700 ring-indigo-200',  dot: 'bg-indigo-500' },
  confirmed:   { label: 'Confirmed',   classes: 'bg-sky-50 text-sky-700 ring-sky-200',            dot: 'bg-sky-500' },
  checked_in:  { label: 'Checked In',  classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',dot: 'bg-emerald-500' },
  in_progress: { label: 'In Progress', classes: 'bg-amber-50 text-amber-700 ring-amber-200',      dot: 'bg-amber-500' },
  completed:   { label: 'Completed',   classes: 'bg-gray-100 text-gray-600 ring-gray-200',        dot: 'bg-gray-400' },
  cancelled:   { label: 'Cancelled',   classes: 'bg-red-50 text-red-700 ring-red-200',            dot: 'bg-red-500' },
  no_show:     { label: 'No Show',     classes: 'bg-gray-50 text-gray-500 ring-gray-200',         dot: 'bg-gray-400' },
  rescheduled: { label: 'Rescheduled', classes: 'bg-purple-50 text-purple-700 ring-purple-200',   dot: 'bg-purple-500' },
}

export function statusColor(status: AppointmentStatus) {
  return STATUS_CONFIG[status]?.dot ?? 'bg-gray-400'
}

interface Props {
  status: AppointmentStatus
  size?: 'sm' | 'md'
  className?: string
}

export function AppointmentStatusBadge({ status, size = 'md', className }: Props) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        cfg.classes,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}
