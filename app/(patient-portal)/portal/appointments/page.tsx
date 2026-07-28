import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPortalPatient, getPatientAppointments } from '@/features/patient-portal/queries'
import { PatientAppointmentsClient } from './appointments-client'
import { Calendar, Plus } from 'lucide-react'

export const metadata = { title: 'My Appointments' }

export default async function PatientAppointmentsPage() {
  const patient = await getPortalPatient()
  if (!patient) redirect('/portal/login')

  const appointments = await getPatientAppointments(patient.id)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Appointments</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {patient.full_name} · #{patient.patient_number}
          </p>
        </div>
        <Link
          href="/portal/appointments/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <Plus size={14} />
          Book new
        </Link>
      </div>

      <PatientAppointmentsClient appointments={appointments as any} />
    </div>
  )
}
