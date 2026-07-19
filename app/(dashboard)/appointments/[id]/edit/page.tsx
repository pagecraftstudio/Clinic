import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarClock } from 'lucide-react'
import { getAppointmentById } from '@/features/appointments/queries'
import { AppointmentForm } from '@/components/appointments/appointment-form'

interface Props { params: { id: string } }

export const metadata: Metadata = { title: 'Edit Appointment | Clinic CMS' }

export default async function EditAppointmentPage({ params }: Props) {
  let appointment
  try {
    appointment = await getAppointmentById(params.id)
  } catch {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <Link
          href={`/appointments/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--accent-light)]">
            <CalendarClock className="size-5 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Edit Appointment</h1>
            <p className="text-sm text-[var(--text-muted)] font-mono">{appointment.appointment_number}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <AppointmentForm appointment={appointment} />
      </div>
    </div>
  )
}
