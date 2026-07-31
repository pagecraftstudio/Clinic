import { getMaintenanceMode } from '@/features/admin/queries'
import { AdminSettingsClient } from '@/components/admin/admin-settings-client'

export const metadata = { title: 'Super Admin — Platform Settings' }

export default async function AdminSettingsPage() {
  const maintenance = await getMaintenanceMode()
  return <AdminSettingsClient initial={maintenance} />
}
