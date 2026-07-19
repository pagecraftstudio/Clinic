import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CalendarClock } from 'lucide-react'
import { AppointmentForm } from '@/components/appointments/appointment-form'

export const metadata: Metadata = { title: 'New Appointment | Clinic CMS' }

export default function NewAppointmentPage({
  searchParams,
}: {
  searchParams: { patient_id?: string }
}) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/appointments"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Appointments
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--accent-light)]">
            <CalendarClock className="size-5 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">New Appointment</h1>
            <p className="text-sm text-[var(--text-muted)]">Book an appointment for a patient</p>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <AppointmentForm defaultPatientId={searchParams.patient_id} />
      </div>
    </div>
  )
}
