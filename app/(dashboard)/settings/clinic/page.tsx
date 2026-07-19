import { getClinicSettings } from '@/features/settings/queries'
import { ClinicSettingsClient } from '@/components/settings/clinic-settings-client'

export const metadata = { title: 'Clinic Settings' }

export default async function ClinicSettingsPage() {
  const settings = await getClinicSettings()
  return <ClinicSettingsClient settings={settings} />
}
