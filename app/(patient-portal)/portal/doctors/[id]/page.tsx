import { notFound } from 'next/navigation'
import { getDoctorPublicProfile, getDoctorRatings } from '@/features/patient-portal/queries'
import { DoctorProfileClient } from './doctor-profile-client'

export const dynamic = 'force-dynamic'

export default async function DoctorProfilePage({ params }: { params: { id: string } }) {
  const [doctor, ratings] = await Promise.all([
    getDoctorPublicProfile(params.id),
    getDoctorRatings(params.id),
  ])
  if (!doctor) notFound()
  return <DoctorProfileClient doctor={doctor} ratings={ratings as any} />
}
