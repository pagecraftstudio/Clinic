'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { RadiologyOrderForm } from '@/components/radiology/radiology-order-form'
import { useCreateRadiologyOrder } from '@/features/radiology/hooks'
import type { RadiologyOrderFormValues } from '@/lib/validations/radiology'
import type { RadiologyType } from '@/types/radiology'

interface Props {
  patients: { id: string; full_name: string; patient_number: string }[]
  doctors: { id: string; profiles: { display_name: string } | null }[]
  radiologyTypes: RadiologyType[]
}

export function NewRadiologyClient({ patients, doctors, radiologyTypes }: Props) {
  const router = useRouter()
  const create = useCreateRadiologyOrder()

  async function handleSubmit(data: RadiologyOrderFormValues) {
    const res = await create.mutateAsync(data)
    if (res.success && res.data) {
      router.push(`/radiology/${res.data.id}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[800px] mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/radiology')}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            New Radiology Order
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Request imaging for a patient
          </p>
        </div>
      </div>
      <RadiologyOrderForm
        patients={patients}
        doctors={doctors}
        radiologyTypes={radiologyTypes}
        onSubmit={handleSubmit}
        isSubmitting={create.isPending}
      />
    </div>
  )
}
