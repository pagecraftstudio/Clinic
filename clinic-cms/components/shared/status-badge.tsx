import { cn } from '@/lib/utils'

const APPOINTMENT_COLORS: Record<string, string> = {
  scheduled: 'var(--status-scheduled)',
  confirmed: 'var(--status-confirmed)',
  checked_in: 'var(--status-checked-in)',
  in_progress: 'var(--status-in-progress)',
  completed: 'var(--status-completed)',
  cancelled: 'var(--status-cancelled)',
  no_show: 'var(--status-no-show)',
  rescheduled: 'var(--status-scheduled)',
}

function Dot({ color }: { color: string }) {
  return <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
}

function Pill({
  label, color, bg, className,
}: { label: string; color: string; bg: string; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', className)}
      style={{ color, background: bg }}
    >
      <Dot color={color} />
      {label.replace(/_/g, ' ')}
    </span>
  )
}

export function AppointmentBadge({ status }: { status: string }) {
  const color = APPOINTMENT_COLORS[status] ?? 'var(--text-muted)'
  return <Pill label={status} color={color} bg="var(--bg-subtle)" />
}

export function PatientStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive
    ? <Pill label="Active" color="var(--success)" bg="var(--success-light)" />
    : <Pill label="Inactive" color="var(--text-muted)" bg="var(--bg-subtle)" />
}

export function GenderBadge({ gender }: { gender: string | null }) {
  if (!gender) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const color = gender === 'male' ? 'var(--info)' : gender === 'female' ? '#DB2777' : 'var(--text-muted)'
  const bg = gender === 'male' ? 'var(--info-light)' : gender === 'female' ? '#FDF2F8' : 'var(--bg-subtle)'
  return <Pill label={gender} color={color} bg={bg} />
}

export function BloodGroupBadge({ group }: { group: string }) {
  if (group === 'unknown') return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return <Pill label={group} color="var(--danger)" bg="var(--danger-light)" />
}

export function StatusBadge({
  label, tone = 'neutral',
}: { label: string; tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }) {
  const map = {
    success: ['var(--success)', 'var(--success-light)'],
    warning: ['var(--warning)', 'var(--warning-light)'],
    danger: ['var(--danger)', 'var(--danger-light)'],
    info: ['var(--info)', 'var(--info-light)'],
    neutral: ['var(--text-muted)', 'var(--bg-subtle)'],
  } as const
  const [color, bg] = map[tone]
  return <Pill label={label} color={color} bg={bg} />
}
