import { createClient } from '@/lib/supabase/server'
import { NewLabClient } from './new-lab-client'

export const metadata = { title: 'New Lab Request' }

export default async function NewLabPage() {
  const supabase = await createClient()

  const [{ data: patients }, { data: doctors }] = await Promise.all([
    supabase
      .from('patients')
      .select('id, full_name, patient_number')
      .order('full_name'),
    supabase
      .from('doctors')
      .select('id, profiles ( display_name )')
      .order('id'),
  ])

  return (
    <NewLabClient
      patients={patients ?? []}
      doctors={doctors ?? []}
    />
  )
}
