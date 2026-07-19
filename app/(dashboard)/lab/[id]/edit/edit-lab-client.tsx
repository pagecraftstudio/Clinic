'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { LabRequestForm } from '@/components/lab/lab-request-form'
import { useCreateLabRequest } from '@/features/lab/hooks'
import { updateLabResults } from '@/features/lab/actions'
import type { LabRequest } from '@/types/lab'
import type { LabRequestFormValues } from '@/lib/validations/lab'
import { useState } from 'react'

interface Props {
  request: LabRequest
  patients: { id: string; full_name: string; patient_number: string }[]
  doctors: { id: string; profiles: { display_name: string } | null }[]
}

export function EditLabClient({ request, patients, doctors }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(data: LabRequestFormValues) {
    setIsSubmitting(true)
    const res = await updateLabResults(request.id, {
      report_notes: request.report_notes,
      tests: data.tests,
    })
    setIsSubmitting(false)
    if (res.success) router.push(`/lab/${request.id}`)
  }

  const defaultValues: Partial<LabRequestFormValues> = {
    patient_id: request.patient_id,
    doctor_id: request.doctor_id,
    visit_id: request.visit_id,
    priority: request.priority,
    diagnosis: request.diagnosis ?? '',
    clinical_notes: request.clinical_notes ?? '',
    tests: request.lab_results?.map((r) => ({
      test_name: r.test_name,
      value: r.value,
      unit: r.unit,
      reference_range: r.reference_range,
      is_abnormal: r.is_abnormal,
      notes: r.notes,
      sort_order: r.sort_order,
    })) ?? [],
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[800px] mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/lab/${request.id}`)}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Edit {request.request_number}
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Modify tests for this request
          </p>
        </div>
      </div>

      <LabRequestForm
        defaultValues={defaultValues}
        patients={patients}
        doctors={doctors}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
      />
    </div>
  )
}
