'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft, Edit2, Clock, User, Stethoscope, FileText,
  Video, CheckCheck, PlayCircle, UserCheck, XCircle,
  CalendarClock, AlertTriangle, Trash2,
} from 'lucide-react'
import type { Appointment } from '@/types/appointment'
import { AppointmentStatusBadge } from '@/components/appointments/appointment-status-badge'
import { CancelDialog, RescheduleDialog } from '@/components/appointments/appointment-dialogs'
import {
  checkInAppointment, startAppointment, completeAppointment,
  markNoShow, confirmAppointment, deleteAppointment,
} from '@/features/appointments/actions'
import { cn } from '@/lib/utils'

interface Props { appointment: Appointment }

export function AppointmentDetailClient({ appointment: apt }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [showCancel,  setCancel]  = useState(false)
  const [showResched, setResched] = useState(false)
  const [showDelete,  setDelete]  = useState(false)

  async function transition(fn: () => Promise<{ success: boolean; error?: string }>) {
    start(async () => {
      const res = await fn()
      if (!res.success) alert(res.error)
    })
  }

  const canCheckIn   = apt.status === 'scheduled' || apt.status === 'confirmed'
  const canStart     = apt.status === 'checked_in'
  const canComplete  = apt.status === 'in_progress'
  const canConfirm   = apt.status === 'scheduled'
  const canNoShow    = apt.status === 'scheduled' || apt.status === 'confirmed'
  const canCancel    = !['completed', 'cancelled', 'no_show'].includes(apt.status)
  const canResched   = !['completed', 'cancelled', 'no_show'].includes(apt.status)

  const doctorName  = apt.doctors?.profiles?.display_name ?? '—'
  const patientName = apt.patients?.full_name ?? '—'
  const startTime   = new Date(apt.scheduled_at)
  const endTime     = apt.end_at ? new Date(apt.end_at) : null

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Back */}
        <Link
          href="/appointments"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Appointments
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-mono text-sm text-[var(--text-muted)]">{apt.appointment_number}</span>
                <AppointmentStatusBadge status={apt.status} />
                {apt.is_online && (
                  <span className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full">
                    <Video className="size-3" /> Online
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{patientName}</h1>
              <p className="text-[var(--text-muted)] text-sm mt-1">{apt.type.replace('_', ' ')}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/appointments/${apt.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <Edit2 className="size-3.5" /> Edit
              </Link>
              {canResched && (
                <button
                  onClick={() => setResched(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <CalendarClock className="size-3.5" /> Reschedule
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setCancel(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <XCircle className="size-3.5" /> Cancel
                </button>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-5 pt-5 border-t border-[var(--border)] flex flex-wrap gap-2">
            {canConfirm  && <ActionBtn icon={<CheckCheck />}   onClick={() => transition(() => confirmAppointment(apt.id))}  loading={isPending}>Confirm</ActionBtn>}
            {canCheckIn  && <ActionBtn icon={<UserCheck />}    onClick={() => transition(() => checkInAppointment(apt.id))}  loading={isPending}>Check In</ActionBtn>}
            {canStart    && <ActionBtn icon={<PlayCircle />}   onClick={() => transition(() => startAppointment(apt.id))}    loading={isPending}>Start Session</ActionBtn>}
            {canComplete && <ActionBtn icon={<CheckCheck />}   onClick={() => transition(() => completeAppointment(apt.id))} loading={isPending} green>Mark Complete</ActionBtn>}
            {canNoShow   && <ActionBtn icon={<AlertTriangle />} onClick={() => transition(() => markNoShow(apt.id))}          loading={isPending} warn>No Show</ActionBtn>}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard title="Timing">
            <InfoRow icon={<Clock />} label="Date">
              {format(startTime, 'MMMM d, yyyy')}
            </InfoRow>
            <InfoRow icon={<Clock />} label="Time">
              {format(startTime, 'h:mm a')}
              {endTime && <> – {format(endTime, 'h:mm a')}</>}
              <span className="text-[var(--text-muted)] ml-1">({apt.duration} min)</span>
            </InfoRow>
            {apt.checked_in_at && (
              <InfoRow icon={<UserCheck />} label="Checked In">
                {format(new Date(apt.checked_in_at), 'h:mm a')}
              </InfoRow>
            )}
            {apt.checked_out_at && (
              <InfoRow icon={<CheckCheck />} label="Checked Out">
                {format(new Date(apt.checked_out_at), 'h:mm a')}
              </InfoRow>
            )}
          </InfoCard>

          <InfoCard title="People">
            <InfoRow icon={<User />} label="Patient">
              <Link href={`/patients/${apt.patient_id}`} className="text-[var(--accent)] hover:underline">
                {patientName}
              </Link>
              {apt.patients?.patient_number && (
                <span className="text-[var(--text-muted)] ml-1 text-xs">({apt.patients.patient_number})</span>
              )}
            </InfoRow>
            <InfoRow icon={<Stethoscope />} label="Doctor">
              {doctorName}
              {apt.doctors?.specialty && (
                <span className="text-[var(--text-muted)] ml-1 text-xs">· {apt.doctors.specialty}</span>
              )}
            </InfoRow>
          </InfoCard>

          {(apt.chief_complaint || apt.notes) && (
            <InfoCard title="Notes" className="md:col-span-2">
              {apt.chief_complaint && (
                <InfoRow icon={<FileText />} label="Chief Complaint">
                  {apt.chief_complaint}
                </InfoRow>
              )}
              {apt.notes && (
                <InfoRow icon={<FileText />} label="Notes">
                  {apt.notes}
                </InfoRow>
              )}
            </InfoCard>
          )}

          {apt.status === 'cancelled' && apt.cancellation_reason && (
            <div className="md:col-span-2 rounded-xl bg-red-50 border border-red-200 p-4">
              <h3 className="text-sm font-semibold text-red-700 mb-1">Cancellation Reason</h3>
              <p className="text-sm text-red-600">{apt.cancellation_reason}</p>
              {apt.cancelled_at && (
                <p className="text-xs text-red-400 mt-1">
                  Cancelled at {format(new Date(apt.cancelled_at), 'MMM d, yyyy h:mm a')}
                </p>
              )}
            </div>
          )}

          {apt.is_online && apt.online_link && (
            <div className="md:col-span-2 rounded-xl bg-sky-50 border border-sky-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-sky-700">Online Meeting</h3>
                <p className="text-xs text-sky-500 mt-0.5 truncate max-w-xs">{apt.online_link}</p>
              </div>
              <a
                href={apt.online_link}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-700 transition-colors"
              >
                Join
              </a>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="border border-red-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-red-700 mb-1">Danger Zone</h3>
          <p className="text-xs text-red-500 mb-3">Deleting hides the appointment from all views (soft delete).</p>
          <button
            onClick={() => setDelete(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="size-3.5" /> Delete Appointment
          </button>
        </div>
      </div>

      {showCancel && (
        <CancelDialog
          appointmentId={apt.id}
          onClose={() => setCancel(false)}
          onSuccess={() => router.refresh()}
        />
      )}
      {showResched && (
        <RescheduleDialog
          appointmentId={apt.id}
          currentAt={apt.scheduled_at}
          currentDuration={apt.duration}
          onClose={() => setResched(false)}
          onSuccess={() => router.refresh()}
        />
      )}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Delete Appointment?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              This will soft-delete the appointment. It won&apos;t be visible in calendar views.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDelete(false)}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  start(async () => {
                    await deleteAppointment(apt.id)
                    router.push('/appointments')
                  })
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────
function InfoCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-[var(--border)] shadow-sm p-5', className)}>
      <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="size-4 text-[var(--text-muted)] mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
        <div className="text-sm text-[var(--text-primary)] mt-0.5">{children}</div>
      </div>
    </div>
  )
}

function ActionBtn({
  icon, onClick, loading, children, green, warn,
}: {
  icon: React.ReactNode
  onClick: () => void
  loading?: boolean
  children: React.ReactNode
  green?: boolean
  warn?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60',
        green ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
          : warn ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
          : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]',
      )}
    >
      <span className="size-4">{icon}</span>
      {children}
    </button>
  )
}
