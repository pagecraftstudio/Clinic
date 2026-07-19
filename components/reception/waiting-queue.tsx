'use client'

import { useWaitingQueue } from '@/features/reception/hooks'
import {
  useCheckIn, useStartAppointment, useCompleteAppointment,
} from '@/features/appointments/hooks'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { Clock, User, Stethoscope, Play, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types/appointment'

function QueueCard({ appt, position }: { appt: Appointment; position: number }) {
  const startMut    = useStartAppointment()
  const completeMut = useCompleteAppointment()

  const isCheckedIn  = appt.status === 'checked_in'
  const isInProgress = appt.status === 'in_progress'

  const waitSince = appt.checked_in_at
    ? formatDistanceToNow(parseISO(appt.checked_in_at), { addSuffix: false })
    : '—'

  const doctorName = appt.doctors?.profiles?.display_name ?? '—'
  const patientName = appt.patients?.full_name ?? '—'

  return (
    <div
      className={cn(
        'card p-4 flex items-center gap-4 transition-all',
        isInProgress && 'border-[var(--warning)] bg-[var(--warning-light)]',
        isCheckedIn  && 'border-[var(--success)] bg-[var(--success-light)]',
      )}
    >
      {/* Position number */}
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
          isInProgress ? 'bg-[var(--warning)] text-white' : 'bg-[var(--accent)] text-white',
        )}
      >
        {position}
      </div>

      {/* Patient info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{patientName}</p>
          <span
            className={cn(
              'badge text-[10px]',
              isInProgress
                ? 'bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]/20'
                : 'bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/20',
            )}
          >
            {isInProgress ? 'In Progress' : 'Waiting'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <Stethoscope size={11} />
            {doctorName}
          </span>
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <Clock size={11} />
            {format(parseISO(appt.scheduled_at), 'HH:mm')}
          </span>
          {appt.checked_in_at && (
            <span className="text-xs text-[var(--text-muted)]">
              Wait: {waitSince}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isCheckedIn && (
          <button
            onClick={() => startMut.mutate(appt.id)}
            disabled={startMut.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--warning)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            <Play size={12} />
            Start
          </button>
        )}
        {isInProgress && (
          <button
            onClick={() => completeMut.mutate(appt.id)}
            disabled={completeMut.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--success)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            <CheckCircle2 size={12} />
            Complete
          </button>
        )}
      </div>
    </div>
  )
}

export function WaitingQueue() {
  const { data: queue = [], isLoading } = useWaitingQueue()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-16 skeleton" />
        ))}
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mb-3">
          <User size={20} className="text-[var(--text-muted)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Queue is empty</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">No patients waiting right now</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {queue.map((appt, i) => (
        <QueueCard key={appt.id} appt={appt} position={i + 1} />
      ))}
    </div>
  )
}
