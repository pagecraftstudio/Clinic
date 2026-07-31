import { getAnnouncements } from '@/features/admin/queries'
import { AdminAnnouncementsClient } from '@/components/admin/admin-announcements-client'

export const metadata = { title: 'Super Admin — Announcements' }

export default async function AdminAnnouncementsPage() {
  const announcements = await getAnnouncements()
  return <AdminAnnouncementsClient announcements={announcements} />
}
