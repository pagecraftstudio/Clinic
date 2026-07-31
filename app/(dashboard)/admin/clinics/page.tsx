import { getAdminClinics } from '@/features/admin/queries'
import { AdminClinicsClient } from '@/components/admin/admin-clinics-client'

export const metadata = { title: 'Super Admin — Clinics' }

export default async function AdminClinicsPage() {
  const clinics = await getAdminClinics()
  return <AdminClinicsClient clinics={clinics} />
}
