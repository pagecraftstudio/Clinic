import type { Metadata } from 'next'
import { AppointmentsCalendarClient } from './appointments-calendar-client'

export const metadata: Metadata = {
  title: 'Appointments | Clinic CMS',
  description: 'Manage appointments — day, week, month, and agenda views',
}

export default function AppointmentsPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <AppointmentsCalendarClient />
    </div>
  )
}
