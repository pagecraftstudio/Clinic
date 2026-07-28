import { redirect } from 'next/navigation'
import { getPortalPatient, getPortalDoctors } from '@/features/patient-portal/queries'
import { BookingClient } from './booking-client'

export const metadata = { title: 'Book Appointment' }

export default async function BookAppointmentPage() {
  const [patient, doctors] = await Promise.all([getPortalPatient(), getPortalDoctors()])
  if (!patient) redirect('/portal/login')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Book an appointment</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Choose a doctor and pick a date and time.
        </p>
      </div>
      <BookingClient doctors={doctors as any} />
    </div>
  )
}
