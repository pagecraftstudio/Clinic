import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPrescriptionById } from '@/features/prescriptions/queries'
import { EditPrescriptionClient } from './edit-prescription-client'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Edit Prescription' }

export default async function EditPrescriptionPage({ params }: Props) {
  const { id } = await params

  try {
    const [prescription, { data: patients }, { data: doctors }] = await Promise.all([
      getPrescriptionById(id),
      (await createClient())
        .from('patients')
        .select('id, full_name, patient_number')
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('full_name'),
      (await createClient())
        .from('doctors')
        .select('id, specialty, profiles ( display_name )')
        .eq('is_active', true)
        .order('specialty'),
    ])

    if (prescription.is_dispensed) notFound()

    return (
      <EditPrescriptionClient
        prescription={prescription}
        patients={patients ?? []}
        doctors={doctors ?? []}
      />
    )
  } catch {
    notFound()
  }
}
