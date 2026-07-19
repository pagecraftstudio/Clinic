import { createClient } from '@/lib/supabase/server'
import { NewInvoiceClient } from './new-invoice-client'

export const metadata = { title: 'New Invoice' }

export default async function NewInvoicePage() {
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

  return <NewInvoiceClient patients={patients ?? []} doctors={doctors ?? []} />
}
