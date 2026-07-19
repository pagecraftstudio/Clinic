import { getNotificationTemplates } from '@/features/settings/queries'
import { NotificationsClient } from '@/components/settings/notifications-client'

export const metadata = { title: 'Notification Templates' }

export default async function NotificationsPage() {
  const templates = await getNotificationTemplates()
  return <NotificationsClient initialTemplates={templates} />
}
