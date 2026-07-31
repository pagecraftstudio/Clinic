export const dynamic = 'force-dynamic'

import { getPortalClinicSettings, getPortalDoctors, getPortalPatient } from '@/features/patient-portal/queries'
import { PortalHomeClient } from './home-client'

export default async function PatientPortalHome() {
  const [clinic, doctors, patient] = await Promise.all([
    getPortalClinicSettings(),
    getPortalDoctors(),
    getPortalPatient(),
  ])
  return <PortalHomeClient clinic={clinic} doctors={doctors} patient={patient} />
}
