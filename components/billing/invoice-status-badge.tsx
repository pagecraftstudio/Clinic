import { cn } from '@/lib/utils'
import type { InvoiceStatus } from '@/types/billing'

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: 'var(--text-muted)',      bg: 'var(--bg-subtle)' },
  issued:    { label: 'Issued',    color: 'var(--info)',            bg: 'var(--info-light)' },
  partial:   { label: 'Partial',   color: 'var(--warning)',         bg: 'var(--warning-light)' },
  paid:      { label: 'Paid',      color: 'var(--success)',         bg: 'var(--success-light)' },
  refunded:  { label: 'Refunded',  color: 'var(--status-no-show)',  bg: 'var(--bg-subtle)' },
  cancelled: { label: 'Cancelled', color: 'var(--danger)',          bg: 'var(--danger-light)' },
}

export function InvoiceStatusBadge({
  status,
  className,
}: {
  status: InvoiceStatus
  className?: string
}) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold',
        className,
      )}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}
