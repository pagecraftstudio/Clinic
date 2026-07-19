import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLabRequestById } from '@/features/lab/queries'
import { EditLabClient } from './edit-lab-client'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Edit Lab Request' }

export default async function EditLabPage({ params }: Props) {
  const { id } = await params

  try {
    const [request, supabase] = await Promise.all([
      getLabRequestById(id),
      createClient(),
    ])

    const [{ data: patients }, { data: doctors }] = await Promise.all([
      supabase.from('patients').select('id, full_name, patient_number').order('full_name'),
      supabase.from('doctors').select('id, profiles ( display_name )').order('id'),
    ])

    return (
      <EditLabClient
        request={request}
        patients={patients ?? []}
        doctors={doctors ?? []}
      />
    )
  } catch {
    notFound()
  }
}
