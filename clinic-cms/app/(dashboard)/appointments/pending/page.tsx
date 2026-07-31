import { createClient } from '@/lib/supabase/server'
import { requireActiveClinicId } from '@/lib/clinic-context'
import { PendingAppointmentsClient } from './pending-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pending Approvals' }

export default async function PendingAppointmentsPage() {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id, appointment_number, scheduled_at, end_at, duration, type,
      status, approval_status, chief_complaint, is_guest,
      guest_name, guest_phone, guest_email, created_at,
      patients ( id, full_name, phone, patient_number ),
      doctors ( id, specialty, profiles ( display_name ) )
    `)
    .eq('clinic_id', clinicId)
    .eq('approval_status', 'pending')
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true })

  return <PendingAppointmentsClient appointments={(appointments ?? []) as any} />
}
