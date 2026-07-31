import { getFeatureFlags } from '@/features/admin/queries'
import { AdminFlagsClient } from '@/components/admin/admin-flags-client'

export const metadata = { title: 'Super Admin — Feature Flags' }

export default async function AdminFlagsPage() {
  const flags = await getFeatureFlags()
  return <AdminFlagsClient flags={flags} />
}
