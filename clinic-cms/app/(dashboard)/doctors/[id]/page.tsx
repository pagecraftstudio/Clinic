import { notFound } from 'next/navigation'
import { getDoctorById } from '@/features/doctors/queries'
import { DoctorDetailClient } from './doctor-detail-client'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  try {
    const doc = await getDoctorById(id)
    const name = doc.profiles?.display_name ?? `${doc.profiles?.first_name} ${doc.profiles?.last_name}`
    return { title: name }
  } catch {
    return { title: 'Doctor' }
  }
}

export default async function DoctorPage({ params }: Props) {
  const { id } = await params
  try {
    const doctor = await getDoctorById(id)
    return <DoctorDetailClient doctor={doctor} />
  } catch {
    notFound()
  }
}
