import type { RadiologyStatus } from '@/types/radiology'

interface Props { status: RadiologyStatus }

const STATUS_CONFIG: Record<RadiologyStatus, { label: string; bg: string; color: string }> = {
  requested:  { label: 'Requested',  bg: 'bg-yellow-500/15', color: 'text-yellow-400' },
  scheduled:  { label: 'Scheduled',  bg: 'bg-blue-500/15',   color: 'text-blue-400' },
  completed:  { label: 'Completed',  bg: 'bg-emerald-500/15',color: 'text-emerald-400' },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-500/15',    color: 'text-red-400' },
}

export function RadiologyStatusBadge({ status }: Props) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}
