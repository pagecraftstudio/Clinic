'use client'

import { useState, useTransition } from 'react'
import { cancelAppointment, rescheduleAppointment } from '@/features/appointments/actions'
import { X, Loader2, CalendarClock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Cancel Dialog ────────────────────────────────────────────
interface CancelProps {
  appointmentId: string
  onClose: () => void
  onSuccess?: () => void
}

export function CancelDialog({ appointmentId, onClose, onSuccess }: CancelProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()

  async function handleCancel() {
    if (!reason.trim()) { setError('Reason is required'); return }
    setError(null)
    start(async () => {
      const res = await cancelAppointment(appointmentId, { cancellation_reason: reason })
      if (!res.success) { setError(res.error ?? 'Failed'); return }
      onSuccess?.()
      onClose()
    })
  }

  return (
    <DialogShell title="Cancel Appointment" onClose={onClose}>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        This will mark the appointment as cancelled. Provide a reason below.
      </p>
      <textarea
        rows={3}
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Reason for cancellation…"
        className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-3 mt-4">
        <DialogBtn variant="ghost" onClick={onClose}>Dismiss</DialogBtn>
        <DialogBtn variant="danger" onClick={handleCancel} loading={isPending}>
          <XCircle className="size-4" /> Cancel Appointment
        </DialogBtn>
      </div>
    </DialogShell>
  )
}

// ── Reschedule Dialog ────────────────────────────────────────
interface RescheduleProps {
  appointmentId: string
  currentAt: string
  currentDuration: number
  onClose: () => void
  onSuccess?: () => void
}

export function RescheduleDialog({ appointmentId, currentAt, currentDuration, onClose, onSuccess }: RescheduleProps) {
  function toLocal(iso: string) {
    const d = new Date(iso)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const [datetime, setDatetime] = useState(toLocal(currentAt))
  const [duration, setDuration]  = useState(currentDuration)
  const [notes, setNotes]        = useState('')
  const [error, setError]        = useState<string | null>(null)
  const [isPending, start]       = useTransition()

  async function handleReschedule() {
    setError(null)
    start(async () => {
      const res = await rescheduleAppointment(appointmentId, {
        scheduled_at: new Date(datetime).toISOString(),
        duration,
        notes: notes || null,
      })
      if (!res.success) { setError(res.error ?? 'Failed'); return }
      onSuccess?.()
      onClose()
    })
  }

  return (
    <DialogShell title="Reschedule Appointment" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">New Date & Time</label>
          <input
            type="datetime-local"
            value={datetime}
            onChange={e => setDatetime(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Duration (min)</label>
          <select
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {[10, 15, 20, 30, 45, 60, 90, 120].map(d => (
              <option key={d} value={d}>{d} min</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Note (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Reason for reschedule…"
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-3 mt-5">
        <DialogBtn variant="ghost" onClick={onClose}>Dismiss</DialogBtn>
        <DialogBtn variant="primary" onClick={handleReschedule} loading={isPending}>
          <CalendarClock className="size-4" /> Reschedule
        </DialogBtn>
      </div>
    </DialogShell>
  )
}

// ── Shared primitives ────────────────────────────────────────
function DialogShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-muted)]">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'ghost' | 'primary' | 'danger'
  loading?: boolean
  children: React.ReactNode
}
function DialogBtn({ variant, loading, children, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60',
        variant === 'ghost'   && 'border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]',
        variant === 'primary' && 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
        variant === 'danger'  && 'bg-red-600 text-white hover:bg-red-700',
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  )
}
