import { redirect } from 'next/navigation'
import { getPortalPatient, getPortalDoctors } from '@/features/patient-portal/queries'
import { BookingClient } from './booking-client'
import { BookingHeader } from './booking-header'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Book Appointment' }

export default async function BookAppointmentPage() {
  const [patient, doctors] = await Promise.all([getPortalPatient(), getPortalDoctors()])
  if (!patient) redirect('/portal/login')
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BookingHeader />
      <BookingClient doctors={doctors as any} />
    </div>
  )
}
