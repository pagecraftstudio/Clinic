'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useUpdatePrescription } from '@/features/prescriptions/hooks'
import { PrescriptionForm } from '@/components/prescriptions/prescription-form'
import type { PrescriptionFormValues } from '@/lib/validations/prescription'
import type { Prescription } from '@/types/prescription'

interface Props {
  prescription: Prescription
  patients: Array<{ id: string; full_name: string; patient_number: string }>
  doctors: Array<{ id: string; specialty: string; profiles: { display_name: string } | null }>
}

export function EditPrescriptionClient({ prescription, patients, doctors }: Props) {
  const router = useRouter()
  const updatePrescription = useUpdatePrescription(prescription.id)

  const defaultValues: Partial<PrescriptionFormValues> = {
    patient_id: prescription.patient_id,
    doctor_id: prescription.doctor_id,
    visit_id: prescription.visit_id,
    valid_until: prescription.valid_until ?? undefined,
    diagnosis: prescription.diagnosis ?? undefined,
    notes: prescription.notes ?? undefined,
    items: (prescription.prescription_items ?? []).map((item) => ({
      medicine_name: item.medicine_name,
      strength: item.strength,
      form: item.form,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity,
      route: item.route,
      instructions: item.instructions,
      is_prn: item.is_prn,
      sort_order: item.sort_order,
    })),
  }

  async function handleSubmit(values: PrescriptionFormValues) {
    const result = await updatePrescription.mutateAsync(values)
    if (result.success) {
      router.push(`/prescriptions/${prescription.id}`)
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
            Edit {prescription.prescription_number}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Update prescription details
          </p>
        </div>
      </div>

      {updatePrescription.data && !updatePrescription.data.success && (
        <div
          className="rounded-xl px-4 py-3 text-[13px]"
          style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
        >
          {updatePrescription.data.error}
        </div>
      )}

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <PrescriptionForm
          patients={patients}
          doctors={doctors}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isLoading={updatePrescription.isPending}
        />
      </div>
    </div>
  )
}
