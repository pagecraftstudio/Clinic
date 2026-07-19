import type { LabTestStatus, LabTestPriority } from '@/types/lab'

interface StatusProps {
  status: LabTestStatus
}

interface PriorityProps {
  priority: LabTestPriority
}

const STATUS_CONFIG: Record<LabTestStatus, { label: string; bg: string; color: string }> = {
  pending:    { label: 'Pending',    bg: 'bg-yellow-500/15', color: 'text-yellow-400' },
  collected:  { label: 'Collected',  bg: 'bg-blue-500/15',   color: 'text-blue-400' },
  processing: { label: 'Processing', bg: 'bg-purple-500/15', color: 'text-purple-400' },
  completed:  { label: 'Completed',  bg: 'bg-emerald-500/15',color: 'text-emerald-400' },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-500/15',    color: 'text-red-400' },
}

const PRIORITY_CONFIG: Record<LabTestPriority, { label: string; bg: string; color: string }> = {
  routine: { label: 'Routine', bg: 'bg-slate-500/15', color: 'text-slate-400' },
  urgent:  { label: 'Urgent',  bg: 'bg-orange-500/15', color: 'text-orange-400' },
  stat:    { label: 'STAT',    bg: 'bg-red-500/15',    color: 'text-red-400' },
}

export function LabStatusBadge({ status }: StatusProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export function LabPriorityBadge({ priority }: PriorityProps) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}
