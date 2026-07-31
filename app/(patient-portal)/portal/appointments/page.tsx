import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPortalPatient, getPatientAppointments, getPatientWaitingList } from '@/features/patient-portal/queries'
import { PatientAppointmentsClient } from './appointments-client'
import { Plus } from 'lucide-react'
import { AppointmentsHeader } from './appointments-header'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Appointments' }

export default async function PatientAppointmentsPage() {
  const patient = await getPortalPatient()
  if (!patient) redirect('/portal/login')
  const [appointments, waitingList] = await Promise.all([
    getPatientAppointments(patient.id),
    getPatientWaitingList(patient.id),
  ])
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <AppointmentsHeader patient={patient} />
      <PatientAppointmentsClient appointments={appointments as any} waitingList={waitingList as any} />
    </div>
  )
}
