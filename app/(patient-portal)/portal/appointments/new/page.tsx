import { createClient } from '@/lib/supabase/server'
import { getPortalDoctorsWithRatings, getBookingSettings } from '@/features/patient-portal/queries'
import { BookingClient } from './booking-client'
import { BookingHeader } from './booking-header'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Book Appointment' }

export default async function BookAppointmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [doctors, settings] = await Promise.all([
    getPortalDoctorsWithRatings(),
    getBookingSettings(),
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BookingHeader />
      <BookingClient
        doctors={doctors as any}
        settings={settings}
        isAuthenticated={!!user}
      />
    </div>
  )
}
