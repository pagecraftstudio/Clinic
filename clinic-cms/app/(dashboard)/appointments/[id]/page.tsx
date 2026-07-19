import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAppointmentById } from '@/features/appointments/queries'
import { AppointmentDetailClient } from './appointment-detail-client'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const apt = await getAppointmentById(params.id)
    return { title: `${apt.appointment_number} | Appointments` }
  } catch {
    return { title: 'Appointment | Clinic CMS' }
  }
}

export default async function AppointmentDetailPage({ params }: Props) {
  let appointment
  try {
    appointment = await getAppointmentById(params.id)
  } catch {
    notFound()
  }

  return <AppointmentDetailClient appointment={appointment} />
}
