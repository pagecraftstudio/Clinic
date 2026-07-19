'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useCreatePrescription } from '@/features/prescriptions/hooks'
import { PrescriptionForm } from '@/components/prescriptions/prescription-form'
import type { PrescriptionFormValues } from '@/lib/validations/prescription'

interface Props {
  patients: Array<{ id: string; full_name: string; patient_number: string }>
  doctors: Array<{ id: string; specialty: string; profiles: { display_name: string } | null }>
}

export function NewPrescriptionClient({ patients, doctors }: Props) {
  const router = useRouter()
  const createPrescription = useCreatePrescription()

  async function handleSubmit(values: PrescriptionFormValues) {
    const result = await createPrescription.mutateAsync(values)
    if (result.success && result.data) {
      router.push(`/prescriptions/${result.data.id}`)
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
            New Prescription
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Issue a prescription for a patient
          </p>
        </div>
      </div>

      {createPrescription.data && !createPrescription.data.success && (
        <div
          className="rounded-xl px-4 py-3 text-[13px]"
          style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
        >
          {createPrescription.data.error}
        </div>
      )}

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <PrescriptionForm
          patients={patients}
          doctors={doctors}
          onSubmit={handleSubmit}
          isSubmitting={createPrescription.isPending}
        />
      </div>
    </div>
  )
}
