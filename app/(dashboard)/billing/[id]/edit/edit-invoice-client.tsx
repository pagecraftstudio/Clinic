'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useUpdateInvoice } from '@/features/billing/hooks'
import { InvoiceForm } from '@/components/billing/invoice-form'
import type { Invoice } from '@/types/billing'
import type { InvoiceFormValues } from '@/lib/validations/billing'

interface Props {
  invoice: Invoice
  patients: Array<{ id: string; full_name: string; patient_number: string }>
  doctors: Array<{ id: string; specialty: string; profiles: { display_name: string } | null }>
}

export function EditInvoiceClient({ invoice, patients, doctors }: Props) {
  const router = useRouter()
  const update = useUpdateInvoice(invoice.id)

  const defaultValues: Partial<InvoiceFormValues> = {
    patient_id: invoice.patient_id,
    doctor_id: invoice.doctor_id,
    visit_id: invoice.visit_id,
    appointment_id: invoice.appointment_id,
    due_date: invoice.due_date,
    status: invoice.status,
    discount_type: invoice.discount_type as 'flat' | 'percent' | null,
    discount_value: invoice.discount_value,
    tax_percent: invoice.tax_percent,
    notes: invoice.notes,
    insurance_claim: invoice.insurance_claim,
    items: (invoice.invoice_items ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount,
        sort_order: i.sort_order,
      })),
  }

  async function handleSubmit(values: InvoiceFormValues) {
    const result = await update.mutateAsync(values)
    if (result.success) router.push(`/billing/${invoice.id}`)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Edit {invoice.invoice_number}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Modify invoice details and line items
          </p>
        </div>
      </div>

      {update.data && !update.data.success && (
        <div
          className="rounded-xl px-4 py-3 text-[13px]"
          style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
        >
          {update.data.error}
        </div>
      )}

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <InvoiceForm
          patients={patients}
          doctors={doctors}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isLoading={update.isPending}
        />
      </div>
    </div>
  )
}
