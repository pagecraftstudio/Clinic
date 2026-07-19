'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Scan } from 'lucide-react'
import { radiologyOrderSchema, type RadiologyOrderFormValues } from '@/lib/validations/radiology'
import type { RadiologyType } from '@/types/radiology'

interface Props {
  defaultValues?: Partial<RadiologyOrderFormValues>
  patients: { id: string; full_name: string; patient_number: string }[]
  doctors: { id: string; profiles: { display_name: string } | null }[]
  radiologyTypes: RadiologyType[]
  onSubmit: (data: RadiologyOrderFormValues) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

const inputCls = 'w-full px-3 py-2 rounded-xl text-[13px] outline-none border transition-colors'
const inputStyle = {
  background: 'var(--bg-surface)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-[11px]" style={{ color: 'var(--error, #f87171)' }}>{error}</p>}
    </div>
  )
}

const BODY_PARTS = [
  'Head', 'Neck', 'Chest', 'Abdomen', 'Pelvis', 'Spine (Cervical)',
  'Spine (Thoracic)', 'Spine (Lumbar)', 'Shoulder (Left)', 'Shoulder (Right)',
  'Elbow (Left)', 'Elbow (Right)', 'Wrist (Left)', 'Wrist (Right)',
  'Hand (Left)', 'Hand (Right)', 'Hip (Left)', 'Hip (Right)',
  'Knee (Left)', 'Knee (Right)', 'Ankle (Left)', 'Ankle (Right)',
  'Foot (Left)', 'Foot (Right)', 'Upper Extremity', 'Lower Extremity', 'Whole Body',
]

export function RadiologyOrderForm({
  defaultValues,
  patients,
  doctors,
  radiologyTypes,
  onSubmit,
  isSubmitting,
  submitLabel = 'Create Order',
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RadiologyOrderFormValues>({
    resolver: zodResolver(radiologyOrderSchema),
    defaultValues: { ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Scan size={15} style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Order Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Patient *" error={errors.patient_id?.message}>
            <select {...register('patient_id')} className={inputCls} style={inputStyle}>
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.patient_number})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Requesting Doctor *" error={errors.doctor_id?.message}>
            <select {...register('doctor_id')} className={inputCls} style={inputStyle}>
              <option value="">Select doctor…</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.profiles?.display_name ?? d.id}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Scan Type *" error={errors.type_id?.message}>
            <select {...register('type_id')} className={inputCls} style={inputStyle}>
              <option value="">Select type…</option>
              {radiologyTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.price ? ` — ${t.price} EGP` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Body Part">
            <select {...register('body_part')} className={inputCls} style={inputStyle}>
              <option value="">Select body part…</option>
              {BODY_PARTS.map((bp) => (
                <option key={bp} value={bp}>{bp}</option>
              ))}
            </select>
          </Field>

          <Field label="Scheduled Date/Time">
            <input
              {...register('scheduled_at')}
              type="datetime-local"
              className={inputCls}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Clinical Information">
          <textarea
            {...register('clinical_info')}
            rows={3}
            className={inputCls}
            style={inputStyle}
            placeholder="Relevant history, indications, contrast requirements…"
          />
        </Field>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-opacity disabled:opacity-60"
          style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
