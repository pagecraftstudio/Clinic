import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveClinicId } from '@/lib/clinic-context'
import { DashboardShell } from './dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const clinicId = await getActiveClinicId()
  if (!clinicId) redirect('/onboarding/clinic')

  // Fetch active clinic info for shell
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, logo_url, primary_color')
    .eq('id', clinicId)
    .single()

  if (!clinic) redirect('/onboarding/clinic')

  return (
    <DashboardShell
      activeClinicId={clinic.id}
      activeClinicName={clinic.name}
      activeClinicLogo={clinic.logo_url}
    >
      {children}
    </DashboardShell>
  )
}
