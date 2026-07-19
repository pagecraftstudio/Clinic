import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRadiologyOrderById } from '@/features/radiology/queries'
import { EditRadiologyClient } from './edit-radiology-client'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Edit Radiology Order' }

export default async function EditRadiologyPage({ params }: Props) {
  const { id } = await params
  try {
    const [order, supabase] = await Promise.all([
      getRadiologyOrderById(id),
      createClient(),
    ])

    const [{ data: patients }, { data: doctors }, { data: radiologyTypes }] = await Promise.all([
      supabase.from('patients').select('id, full_name, patient_number').order('full_name'),
      supabase.from('doctors').select('id, profiles ( display_name )').order('id'),
      supabase.from('radiology_types').select('*').eq('is_active', true).order('name'),
    ])

    return (
      <EditRadiologyClient
        order={order}
        patients={patients ?? []}
        doctors={doctors ?? []}
        radiologyTypes={radiologyTypes ?? []}
      />
    )
  } catch {
    notFound()
  }
}
