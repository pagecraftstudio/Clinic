import { getPermissions, getRolePermissions } from '@/features/settings/queries'
import { RolesClient } from '@/components/settings/roles-client'

export const metadata = { title: 'Roles & Permissions' }

export default async function RolesPage() {
  const [permissions, rolePermissions] = await Promise.all([
    getPermissions(),
    getRolePermissions(),
  ])

  return <RolesClient permissions={permissions} rolePermissions={rolePermissions} />
}
