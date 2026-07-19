'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { RadiologyOrderForm } from '@/components/radiology/radiology-order-form'
import { updateRadiologyOrder } from '@/features/radiology/actions'
import type { RadiologyOrder, RadiologyType } from '@/types/radiology'
import type { RadiologyOrderFormValues } from '@/lib/validations/radiology'

interface Props {
  order: RadiologyOrder
  patients: { id: string; full_name: string; patient_number: string }[]
  doctors: { id: string; profiles: { display_name: string } | null }[]
  radiologyTypes: RadiologyType[]
}

export function EditRadiologyClient({ order, patients, doctors, radiologyTypes }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues: Partial<RadiologyOrderFormValues> = {
    patient_id: order.patient_id,
    doctor_id: order.doctor_id,
    visit_id: order.visit_id,
    type_id: order.type_id,
    body_part: order.body_part ?? '',
    clinical_info: order.clinical_info ?? '',
    scheduled_at: order.scheduled_at ?? '',
  }

  async function handleSubmit(data: RadiologyOrderFormValues) {
    setIsSubmitting(true)
    const res = await updateRadiologyOrder(order.id, data)
    setIsSubmitting(false)
    if (res.success) router.push(`/radiology/${order.id}`)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[800px] mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/radiology/${order.id}`)}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Edit {order.order_number}
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Modify this radiology order
          </p>
        </div>
      </div>
      <RadiologyOrderForm
        defaultValues={defaultValues}
        patients={patients}
        doctors={doctors}
        radiologyTypes={radiologyTypes}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
      />
    </div>
  )
}
