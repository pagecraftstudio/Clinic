import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { RescheduleClient } from './reschedule-client'

export const dynamic = 'force-dynamic'

export default async function ReschedulePage({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams.id
  if (!id) redirect('/portal/appointments')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = await createAdminClient()
  const { data: patient } = await admin.from('patients').select('id').eq('profile_id', user.id).single()
  if (!patient) redirect('/portal/login')

  const { data: appt } = await admin
    .from('appointments')
    .select('id, doctor_id, scheduled_at, status')
    .eq('id', id)
    .eq('patient_id', patient.id)
    .single()

  if (!appt || ['cancelled', 'completed', 'no_show'].includes(appt.status)) {
    redirect('/portal/appointments')
  }

  return (
    <RescheduleClient
      appointmentId={appt.id}
      doctorId={appt.doctor_id}
      currentDate={appt.scheduled_at}
    />
  )
}
