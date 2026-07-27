import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch stats via the DB function
  const { data: statsData } = await supabase
    .rpc('get_dashboard_stats')

  // Fetch recent audit log activity
  const { data: recentActivity } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <DashboardClient
      stats={statsData ?? null}
      recentActivity={recentActivity ?? []}
    />
  )
}
