import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAppointmentById } from '@/features/appointments/queries'
import { AppointmentDetailClient } from './appointment-detail-client'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const apt = await getAppointmentById(id)
    return { title: `${apt.appointment_number} | Appointments` }
  } catch {
    return { title: 'Appointment | Clinic CMS' }
  }
}

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params
  let appointment
  try {
    appointment = await getAppointmentById(id)
  } catch {
    notFound()
  }

  return <AppointmentDetailClient appointment={appointment} />
}
