import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInvoiceById } from '@/features/billing/queries'
import { EditInvoiceClient } from './edit-invoice-client'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Edit Invoice' }

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const [invoice, { data: patients }, { data: doctors }] = await Promise.all([
      getInvoiceById(id),
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

    return <EditInvoiceClient invoice={invoice} patients={patients ?? []} doctors={doctors ?? []} />
  } catch {
    notFound()
  }
}
