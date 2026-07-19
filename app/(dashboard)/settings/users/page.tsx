import { getStaffUsers } from '@/features/settings/queries'
import { UsersClient } from '@/components/settings/users-client'

export const metadata = { title: 'Users' }

export default async function UsersPage() {
  const users = await getStaffUsers()
  return <UsersClient initialUsers={users} />
}
