import { createClient } from '@/lib/supabase/server'
import { requireActiveClinicId } from '@/lib/clinic-context'
import { WaitingListClient } from './waiting-list-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Waiting List' }

export default async function WaitingListPage() {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])

  const { data: entries } = await supabase
    .from('waiting_list')
    .select(`
      id, preferred_date, preferred_time, type, status, chief_complaint,
      guest_name, guest_phone, created_at,
      patients ( id, full_name, phone, patient_number ),
      doctors ( id, specialty, profiles ( display_name ) )
    `)
    .eq('clinic_id', clinicId)
    .in('status', ['waiting', 'notified'])
    .order('preferred_date', { ascending: true })

  return <WaitingListClient entries={(entries ?? []) as any} />
}
