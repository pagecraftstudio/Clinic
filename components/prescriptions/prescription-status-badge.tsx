'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PrescriptionStatus } from '@/types/prescription'

const STATUS_STYLES: Record<PrescriptionStatus, string> = {
  active:     'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
  dispensed:  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  expired:    'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400',
  cancelled:  'bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400',
}

const STATUS_LABELS: Record<PrescriptionStatus, string> = {
  active:    'Active',
  dispensed: 'Dispensed',
  expired:   'Expired',
  cancelled: 'Cancelled',
}

interface PrescriptionStatusBadgeProps {
  status: PrescriptionStatus
  className?: string
}

export function PrescriptionStatusBadge({ status, className }: PrescriptionStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('text-xs capitalize', STATUS_STYLES[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  )
}
