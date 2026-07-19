'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTodayAppointments } from '@/features/reception/hooks'
import {
  useCheckIn, useConfirmAppointment, useCancelAppointment, useMarkNoShow,
} from '@/features/appointments/hooks'
import { format, parseISO } from 'date-fns'
import {
  Search, UserCheck, Ban, UserX, ExternalLink,
  ChevronRight, Phone, Calendar,
} from 'lucide-react'
import { AppointmentStatusBadge } from '@/components/appointments/appointment-status-badge'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types/appointment'

const ACTION_STATUSES = ['scheduled', 'confirmed', 'checked_in', 'in_progress']

function AppointmentRow({ appt }: { appt: Appointment }) {
  const checkInMut  = useCheckIn()
  const confirmMut  = useConfirmAppointment()
  const noShowMut   = useMarkNoShow()
  const cancelMut   = useCancelAppointment()
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')

  const patient     = appt.patients
  const doctor      = appt.doctors
  const doctorName  = doctor?.profiles?.display_name ?? '—'
  const canAct      = ACTION_STATUSES.includes(appt.status)

  return (
    <div className="group px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors">
      <div className="flex items-center gap-3">
        {/* Time */}
        <div className="w-12 flex-shrink-0 text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {format(parseISO(appt.scheduled_at), 'HH:mm')}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">{appt.duration}m</p>
        </div>

        {/* Patient */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-[var(--text-primary)] truncate">
              {patient?.full_name ?? '—'}
            </p>
            <AppointmentStatusBadge status={appt.status} />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-[var(--text-muted)] truncate">{doctorName} · {doctor?.specialty}</span>
            {patient?.phone && (
              <a
                href={`tel:${patient.phone}`}
                className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                <Phone size={10} />
                {patient.phone}
              </a>
            )}
          </div>
          {appt.chief_complaint && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{appt.chief_complaint}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {appt.status === 'scheduled' && (
            <button
              onClick={() => confirmMut.mutate(appt.id)}
              disabled={confirmMut.isPending}
              title="Confirm"
              className="p-1.5 rounded-lg hover:bg-[var(--info-light)] text-[var(--text-muted)] hover:text-[var(--info)] transition-colors disabled:opacity-50"
            >
              <Calendar size={14} />
            </button>
          )}
          {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
            <>
              <button
                onClick={() => checkInMut.mutate(appt.id)}
                disabled={checkInMut.isPending}
                title="Check In"
                className="p-1.5 rounded-lg hover:bg-[var(--success-light)] text-[var(--text-muted)] hover:text-[var(--success)] transition-colors disabled:opacity-50"
              >
                <UserCheck size={14} />
              </button>
              <button
                onClick={() => noShowMut.mutate(appt.id)}
                disabled={noShowMut.isPending}
                title="No Show"
                className="p-1.5 rounded-lg hover:bg-[var(--warning-light)] text-[var(--text-muted)] hover:text-[var(--warning)] transition-colors disabled:opacity-50"
              >
                <UserX size={14} />
              </button>
              <button
                onClick={() => setCancelling(true)}
                title="Cancel"
                className="p-1.5 rounded-lg hover:bg-[var(--danger-light)] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
              >
                <Ban size={14} />
              </button>
            </>
          )}
          <Link
            href={`/appointments/${appt.id}`}
            title="View"
            className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Cancel inline */}
      {cancelling && (
        <div className="mt-2 flex items-center gap-2 pl-15">
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Cancellation reason…"
            className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--danger)] bg-white"
            autoFocus
          />
          <button
            onClick={async () => {
              await cancelMut.mutateAsync([appt.id, { cancellation_reason: reason || 'Cancelled by reception' }] as Parameters<typeof cancelMut.mutate>)
              setCancelling(false)
              setReason('')
            }}
            disabled={cancelMut.isPending}
            className="px-3 py-1.5 rounded-lg bg-[var(--danger)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            Confirm Cancel
          </button>
          <button
            onClick={() => { setCancelling(false); setReason('') }}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            Keep
          </button>
        </div>
      )}
    </div>
  )
}

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'scheduled',   label: 'Scheduled' },
  { value: 'confirmed',   label: 'Confirmed' },
  { value: 'checked_in',  label: 'Checked In' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
  { value: 'no_show',     label: 'No Show' },
]

export function TodayAppointmentsList() {
  const { data: appointments = [], isLoading } = useTodayAppointments()
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('')

  const filtered = appointments.filter(a => {
    const matchStatus = !statusFilter || a.status === statusFilter
    const term = search.toLowerCase()
    const matchSearch = !term ||
      a.patients?.full_name?.toLowerCase().includes(term) ||
      a.patients?.phone?.includes(term) ||
      a.doctors?.profiles?.display_name?.toLowerCase().includes(term) ||
      a.appointment_number?.toLowerCase().includes(term)
    return matchStatus && matchSearch
  })

  return (
    <div className="card flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3">
        <h2 className="font-semibold text-sm text-[var(--text-primary)]">
          Today's Appointments
          <span className="ml-2 text-xs text-[var(--text-muted)] font-normal">({appointments.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border)] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)] w-40"
            />
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="px-4 py-2 border-b border-[var(--border)] flex items-center gap-1 overflow-x-auto">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
              statusFilter === f.value
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-px p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Calendar size={24} className="text-[var(--text-muted)] mb-2" />
            <p className="text-sm text-[var(--text-secondary)]">
              {search || statusFilter ? 'No matching appointments' : 'No appointments today'}
            </p>
          </div>
        ) : (
          filtered.map(a => <AppointmentRow key={a.id} appt={a} />)
        )}
      </div>
    </div>
  )
}
