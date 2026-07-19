'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useCreateInvoice } from '@/features/billing/hooks'
import { InvoiceForm } from '@/components/billing/invoice-form'
import type { InvoiceFormValues } from '@/lib/validations/billing'

interface Props {
  patients: Array<{ id: string; full_name: string; patient_number: string }>
  doctors: Array<{ id: string; specialty: string; profiles: { display_name: string } | null }>
}

export function NewInvoiceClient({ patients, doctors }: Props) {
  const router = useRouter()
  const createInvoice = useCreateInvoice()

  async function handleSubmit(values: InvoiceFormValues) {
    const result = await createInvoice.mutateAsync(values)
    if (result.success && result.data) {
      router.push(`/billing/${result.data.id}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            New Invoice
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Fill in the details and add line items
          </p>
        </div>
      </div>

      {createInvoice.data && !createInvoice.data.success && (
        <div
          className="rounded-xl px-4 py-3 text-[13px]"
          style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
        >
          {createInvoice.data.error}
        </div>
      )}

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <InvoiceForm
          patients={patients}
          doctors={doctors}
          onSubmit={handleSubmit}
          isLoading={createInvoice.isPending}
        />
      </div>
    </div>
  )
}
