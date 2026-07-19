import { DashboardClient } from './dashboard-client'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  return <DashboardClient stats={null} recentActivity={[]} />
}
