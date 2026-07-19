'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { LabRequestForm } from '@/components/lab/lab-request-form'
import { useCreateLabRequest } from '@/features/lab/hooks'
import type { LabRequestFormValues } from '@/lib/validations/lab'

interface Props {
  patients: { id: string; full_name: string; patient_number: string }[]
  doctors: { id: string; profiles: { display_name: string } | null }[]
}

export function NewLabClient({ patients, doctors }: Props) {
  const router = useRouter()
  const create = useCreateLabRequest()

  async function handleSubmit(data: LabRequestFormValues) {
    const res = await create.mutateAsync(data)
    if (res.success && res.data) {
      router.push(`/lab/${res.data.id}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[800px] mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/lab')}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            New Lab Request
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Order lab tests for a patient
          </p>
        </div>
      </div>

      <LabRequestForm
        patients={patients}
        doctors={doctors}
        onSubmit={handleSubmit}
        isSubmitting={create.isPending}
      />
    </div>
  )
}
