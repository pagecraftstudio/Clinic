import { createClient } from '@/lib/supabase/server'
import { NewRadiologyClient } from './new-radiology-client'

export const metadata = { title: 'New Radiology Order' }

export default async function NewRadiologyPage() {
  const supabase = await createClient()

  const [{ data: patients }, { data: doctors }, { data: radiologyTypes }] = await Promise.all([
    supabase.from('patients').select('id, full_name, patient_number').order('full_name'),
    supabase.from('doctors').select('id, profiles ( display_name )').order('id'),
    supabase.from('radiology_types').select('*').eq('is_active', true).order('name'),
  ])

  return (
    <NewRadiologyClient
      patients={patients ?? []}
      doctors={doctors ?? []}
      radiologyTypes={radiologyTypes ?? []}
    />
  )
}
