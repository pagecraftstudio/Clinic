import { getClinicSettings } from '@/features/settings/queries'
import { InvoiceSettingsClient } from '@/components/settings/invoice-settings-client'

export const metadata = { title: 'Invoice Settings' }

export default async function InvoiceSettingsPage() {
  const settings = await getClinicSettings()
  return <InvoiceSettingsClient settings={settings} />
}
