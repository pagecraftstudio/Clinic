'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft, Edit2, Stethoscope, Phone, Mail, Video, Calendar,
  Clock, DollarSign, CalendarOff, CheckCircle2, XCircle, Power,
  FileText, Globe,
} from 'lucide-react'
import { toggleDoctorActive } from '@/features/doctors/actions'
import { useDoctorAppointmentStats } from '@/features/doctors/hooks'
import { LeaveDialog } from '@/components/doctors/leave-dialog'
import type { Doctor, WorkingHours } from '@/types/doctor'
import { cn } from '@/lib/utils'

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

interface Props { doctor: Doctor }

export function DoctorDetailClient({ doctor: initialDoctor }: Props) {
  const router = useRouter()
  const [doctor, setDoctor] = useState(initialDoctor)
  const [isPending, startTransition] = useTransition()
  const [showLeave, setShowLeave] = useState(false)

  const { data: stats } = useDoctorAppointmentStats(doctor.id)

  const profile = doctor.profiles
  const displayName = profile?.display_name ?? `${profile?.first_name} ${profile?.last_name}`
  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase()

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleDoctorActive(doctor.id, !doctor.is_active)
      if (res.success) setDoctor((d) => ({ ...d, is_active: !d.is_active }))
    })
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Back */}
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Doctors
        </Link>

        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="size-20 rounded-full object-cover border-2 border-white shadow-md" />
              ) : (
                <div className="size-20 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                  {initials || <Stethoscope className="size-8" />}
                </div>
              )}
              {/* Info */}
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">{displayName}</h1>
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                    doctor.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-[var(--surface-muted)] text-[var(--text-muted)]',
                  )}>
                    {doctor.is_active ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                    {doctor.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {doctor.accepts_online && (
                    <span className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full">
                      <Video className="size-3" /> Online
                    </span>
                  )}
                </div>
                <p className="text-[var(--accent)] font-medium">{doctor.specialty}</p>
                {doctor.sub_specialty && <p className="text-sm text-[var(--text-muted)]">{doctor.sub_specialty}</p>}
                {doctor.employee_number && (
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-1">{doctor.employee_number}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleToggle}
                disabled={isPending}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                  doctor.is_active
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50',
                )}
              >
                <Power className="size-4" />
                {doctor.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => setShowLeave(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-[var(--border)] hover:bg-[var(--surface-muted)] transition-colors"
              >
                <CalendarOff className="size-4" /> Leave
              </button>
              <Link
                href={`/doctors/${doctor.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Edit2 className="size-4" /> Edit
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <StatBox label="Total Appointments" value={stats.total} icon={<Calendar className="size-5 text-indigo-400" />} />
            <StatBox label="Today" value={stats.today} icon={<Clock className="size-5 text-amber-400" />} />
            <StatBox label="Upcoming" value={stats.upcoming} icon={<CheckCircle2 className="size-5 text-emerald-400" />} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-5">
            {/* Contact */}
            <Section title="Contact">
              <InfoRow icon={<Mail className="size-4" />} label="Email" value={profile?.email} />
              <InfoRow icon={<Phone className="size-4" />} label="Phone" value={profile?.phone} />
              {doctor.license_number && (
                <InfoRow icon={<FileText className="size-4" />} label="License" value={doctor.license_number} />
              )}
            </Section>

            {/* Fees */}
            <Section title="Fees">
              <InfoRow icon={<DollarSign className="size-4" />} label="Consultation" value={`${doctor.consultation_fee} EGP`} />
              <InfoRow icon={<DollarSign className="size-4" />} label="Follow-up" value={`${doctor.follow_up_fee} EGP`} />
            </Section>

            {/* Bio */}
            {doctor.bio && (
              <Section title="Biography">
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{doctor.bio}</p>
              </Section>
            )}

            {/* Leaves */}
            {(doctor.leaves ?? []).length > 0 && (
              <Section title="Upcoming Leaves">
                <div className="space-y-2">
                  {(doctor.leaves ?? []).map((leave) => (
                    <div key={leave.id} className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                      <p className="text-xs font-medium text-orange-700">
                        {format(new Date(leave.start_date), 'MMM d')} – {format(new Date(leave.end_date), 'MMM d, yyyy')}
                      </p>
                      {leave.reason && <p className="text-xs text-orange-600 mt-0.5">{leave.reason}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Schedule */}
          <div className="lg:col-span-2">
            <Section title="Weekly Schedule">
              <div className="space-y-2">
                {(doctor.working_hours ?? []).map((wh: WorkingHours) => (
                  <div
                    key={wh.day}
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-xl border',
                      wh.is_active ? 'border-[var(--border)] bg-white' : 'border-dashed border-[var(--border)] opacity-40',
                    )}
                  >
                    <span className="w-10 text-xs font-semibold text-[var(--text-muted)] uppercase">
                      {DAY_LABELS[wh.day]}
                    </span>
                    {wh.is_active ? (
                      <>
                        <Clock className="size-3.5 text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-primary)]">
                          {wh.start_time} – {wh.end_time}
                        </span>
                        {wh.break_start && wh.break_end && (
                          <span className="text-xs text-[var(--text-muted)] ml-auto">
                            Break {wh.break_start}–{wh.break_end}
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-muted)] ml-auto">
                          {wh.slot_duration} min slots
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">Day off</span>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* Quick link to appointments */}
            <div className="mt-4">
              <Link
                href={`/appointments?doctor_id=${doctor.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--surface-muted)] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="size-5 text-[var(--accent)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">View Appointments</p>
                    <p className="text-xs text-[var(--text-muted)]">See this doctor's full schedule</p>
                  </div>
                </div>
                <ArrowLeft className="size-4 rotate-180 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showLeave && (
        <LeaveDialog
          doctorId={doctor.id}
          leaves={doctor.leaves ?? []}
          onClose={() => setShowLeave(false)}
          onMutate={() => router.refresh()}
        />
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 space-y-4">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-[var(--text-muted)] flex-shrink-0">{icon}</span>
      <span className="text-[var(--text-muted)] w-20 flex-shrink-0">{label}</span>
      <span className="text-[var(--text-primary)] font-medium truncate">{value}</span>
    </div>
  )
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm px-5 py-4 flex items-center gap-4">
      <div className="p-2 rounded-xl bg-[var(--surface-muted)]">{icon}</div>
      <div>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  )
}
