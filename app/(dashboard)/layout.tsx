import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveClinicId } from '@/lib/clinic-context'
import { getMaintenanceMode, getAnnouncements } from '@/features/admin/queries'
import { DashboardShell } from './dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()
  const isSuperAdmin = profile?.is_super_admin === true

  const clinicId = await getActiveClinicId()
  // Super admins may have no clinic membership at all — they still need
  // the shell to reach /admin, so skip the onboarding redirect for them.
  if (!clinicId && !isSuperAdmin) redirect('/onboarding/clinic')

  const clinic = clinicId
    ? (await supabase.from('clinics').select('id, name, logo_url, primary_color').eq('id', clinicId).single()).data
    : null

  if (!clinic && !isSuperAdmin) redirect('/onboarding/clinic')

  const [maintenance, announcements] = await Promise.all([getMaintenanceMode(), getAnnouncements()])
  const now = Date.now()
  const activeAnnouncements = announcements.filter(
    (a) => a.is_active && (!a.ends_at || new Date(a.ends_at).getTime() > now)
  )

  return (
    <DashboardShell
      activeClinicId={clinic?.id ?? ''}
      activeClinicName={clinic?.name ?? 'Platform Admin'}
      activeClinicLogo={clinic?.logo_url ?? null}
      activeClinicPrimaryColor={clinic?.primary_color ?? null}
      isSuperAdmin={isSuperAdmin}
      maintenanceMode={maintenance.enabled ? maintenance : null}
      announcements={activeAnnouncements}
    >
      {children}
    </DashboardShell>
  )
}
