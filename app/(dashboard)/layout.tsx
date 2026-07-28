import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from './dashboard-shell'

// Server component — runs on Node.js runtime where supabase-js works.
// Validates the session token (not just cookie presence) and redirects
// unauthenticated or expired sessions to /login before rendering anything.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <DashboardShell>{children}</DashboardShell>
}
