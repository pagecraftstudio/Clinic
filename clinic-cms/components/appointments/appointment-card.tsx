'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Clock, User, Stethoscope, Video, MoreHorizontal,
  CheckCheck, PlayCircle, UserCheck, XCircle, CalendarClock, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types/appointment'
import { AppointmentStatusBadge } from './appointment-status-badge'
import { CancelDialog, RescheduleDialog } from './appointment-dialogs'
import {
  checkInAppointment, startAppointment, completeAppointment,
  markNoShow, confirmAppointment,
} from '@/features/appointments/actions'

interface Props {
  appointment: Appointment
  compact?: boolean
}

export function AppointmentCard({ appointment: apt, compact = false }: Props) {
  const [menu, setMenu]       = useState(false)
  const [showCancel, setCancel] = useState(false)
  const [showResched, setResched] = useState(false)
  const [isPending, start]    = useTransition()

  const startTime = new Date(apt.scheduled_at)
  const endTime   = apt.end_at ? new Date(apt.end_at) : null

  async function transition(fn: () => Promise<{ success: boolean; error?: string }>) {
    setMenu(false)
    start(async () => { await fn() })
  }

  const doctorName = apt.doctors?.profiles?.display_name ?? 'Unknown Doctor'
  const patientName = apt.patients?.full_name ?? 'Unknown Patient'

  const canCheckIn   = apt.status === 'scheduled' || apt.status === 'confirmed'
  const canStart     = apt.status === 'checked_in'
  const canComplete  = apt.status === 'in_progress'
  const canConfirm   = apt.status === 'scheduled'
  const canNoShow    = apt.status === 'scheduled' || apt.status === 'confirmed'
  const canCancel    = !['completed', 'cancelled', 'no_show'].includes(apt.status)
  const canResched   = !['completed', 'cancelled', 'no_show'].includes(apt.status)

  return (
    <>
      <div
        className={cn(
          'group relative bg-white rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all',
          compact ? 'p-3' : 'p-4',
          isPending && 'opacity-60 pointer-events-none',
        )}
      >
        {/* Color accent strip */}
        <div className={cn(
          'absolute left-0 top-3 bottom-3 w-1 rounded-r-full',
          apt.status === 'scheduled'   && 'bg-indigo-400',
          apt.status === 'confirmed'   && 'bg-sky-400',
          apt.status === 'checked_in'  && 'bg-emerald-400',
          apt.status === 'in_progress' && 'bg-amber-400',
          apt.status === 'completed'   && 'bg-gray-300',
          apt.status === 'cancelled'   && 'bg-red-400',
          apt.status === 'no_show'     && 'bg-gray-300',
          apt.status === 'rescheduled' && 'bg-purple-400',
        )} />

        <div className="pl-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-[var(--text-muted)]">{apt.appointment_number}</span>
                <AppointmentStatusBadge status={apt.status} size="sm" />
                {apt.is_online && (
                  <span className="inline-flex items-center gap-1 text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                    <Video className="size-3" /> Online
                  </span>
                )}
              </div>
              <Link
                href={`/appointments/${apt.id}`}
                className="block mt-1 font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] truncate"
              >
                {patientName}
              </Link>
            </div>

            {/* Actions menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenu(v => !v)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal className="size-4" />
              </button>
              {menu && (
                <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white border border-[var(--border)] rounded-xl shadow-lg overflow-hidden py-1">
                  <Link href={`/appointments/${apt.id}`} className="menu-item">View Details</Link>
                  <Link href={`/appointments/${apt.id}/edit`} className="menu-item">Edit</Link>
                  <div className="h-px bg-[var(--border)] my-1" />
                  {canConfirm  && <MenuBtn onClick={() => transition(() => confirmAppointment(apt.id))}>Confirm</MenuBtn>}
                  {canCheckIn  && <MenuBtn onClick={() => transition(() => checkInAppointment(apt.id))}>Check In</MenuBtn>}
                  {canStart    && <MenuBtn onClick={() => transition(() => startAppointment(apt.id))}>Start</MenuBtn>}
                  {canComplete && <MenuBtn onClick={() => transition(() => completeAppointment(apt.id))}>Complete</MenuBtn>}
                  {canNoShow   && <MenuBtn onClick={() => transition(() => markNoShow(apt.id))}>Mark No-Show</MenuBtn>}
                  {canResched  && <MenuBtn onClick={() => { setMenu(false); setResched(true) }}>Reschedule</MenuBtn>}
                  {canCancel   && <MenuBtn danger onClick={() => { setMenu(false); setCancel(true) }}>Cancel</MenuBtn>}
                </div>
              )}
            </div>
          </div>

          {/* Meta row */}
          {!compact && (
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {format(startTime, 'h:mm a')}
                {endTime && <> – {format(endTime, 'h:mm a')}</>}
                <span className="text-[var(--text-muted)]">({apt.duration}m)</span>
              </span>
              <span className="flex items-center gap-1">
                <Stethoscope className="size-3" />
                {doctorName}
              </span>
              {apt.chief_complaint && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {apt.chief_complaint}
                </span>
              )}
            </div>
          )}

          {/* Quick actions */}
          {!compact && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {canConfirm  && <QuickBtn icon={<CheckCheck className="size-3" />} onClick={() => transition(() => confirmAppointment(apt.id))}>Confirm</QuickBtn>}
              {canCheckIn  && <QuickBtn icon={<UserCheck className="size-3" />} onClick={() => transition(() => checkInAppointment(apt.id))}>Check In</QuickBtn>}
              {canStart    && <QuickBtn icon={<PlayCircle className="size-3" />} onClick={() => transition(() => startAppointment(apt.id))}>Start</QuickBtn>}
              {canComplete && <QuickBtn icon={<CheckCheck className="size-3" />} onClick={() => transition(() => completeAppointment(apt.id))} green>Done</QuickBtn>}
              {canResched  && <QuickBtn icon={<CalendarClock className="size-3" />} onClick={() => setResched(true)}>Reschedule</QuickBtn>}
              {canCancel   && <QuickBtn icon={<XCircle className="size-3" />} onClick={() => setCancel(true)} danger>Cancel</QuickBtn>}
            </div>
          )}
        </div>
      </div>

      {showCancel && (
        <CancelDialog
          appointmentId={apt.id}
          onClose={() => setCancel(false)}
        />
      )}
      {showResched && (
        <RescheduleDialog
          appointmentId={apt.id}
          currentAt={apt.scheduled_at}
          currentDuration={apt.duration}
          onClose={() => setResched(false)}
        />
      )}

      <style jsx>{`
        .menu-item {
          display: block; padding: 6px 12px;
          font-size: 13px; color: var(--text-primary);
          cursor: pointer;
        }
        .menu-item:hover { background: var(--bg-subtle); }
      `}</style>
    </>
  )
}

function QuickBtn({
  icon, onClick, children, danger, green,
}: { icon: React.ReactNode; onClick: () => void; children: React.ReactNode; danger?: boolean; green?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
        danger ? 'border-red-200 text-red-600 hover:bg-red-50'
          : green ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
          : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]',
      )}
    >
      {icon}{children}
    </button>
  )
}

function MenuBtn({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--bg-subtle)] transition-colors',
        danger ? 'text-red-600' : 'text-[var(--text-primary)]',
      )}
    >
      {children}
    </button>
  )
}
