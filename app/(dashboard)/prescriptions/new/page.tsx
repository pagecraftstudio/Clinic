import { createClient } from '@/lib/supabase/server'
import { NewPrescriptionClient } from './new-prescription-client'

export const metadata = { title: 'New Prescription' }

export default async function NewPrescriptionPage() {
  const supabase = await createClient()

  const [{ data: patients }, { data: doctors }] = await Promise.all([
    supabase
      .from('patients')
      .select('id, full_name, patient_number')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('doctors')
      .select('id, specialty, profiles ( display_name )')
      .eq('is_active', true)
      .order('specialty'),
  ])

  return <NewPrescriptionClient patients={patients ?? []} doctors={doctors ?? []} />
}
