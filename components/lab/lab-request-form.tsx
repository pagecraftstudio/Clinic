'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, FlaskConical, AlertTriangle } from 'lucide-react'
import { labRequestSchema, type LabRequestFormValues } from '@/lib/validations/lab'

interface Props {
  defaultValues?: Partial<LabRequestFormValues>
  patients: { id: string; full_name: string; patient_number: string }[]
  doctors: { id: string; profiles: { display_name: string } | null }[]
  onSubmit: (data: LabRequestFormValues) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

const COMMON_TESTS = [
  'Complete Blood Count (CBC)',
  'Basic Metabolic Panel',
  'Comprehensive Metabolic Panel',
  'Lipid Panel',
  'Thyroid Function (TSH)',
  'Blood Glucose (Fasting)',
  'HbA1c',
  'Liver Function Tests',
  'Kidney Function Tests',
  'Urine Analysis',
  'PT/INR',
  'D-Dimer',
  'C-Reactive Protein (CRP)',
  'ESR',
  'Ferritin',
  'Vitamin D',
  'Vitamin B12',
]

const field = (
  label: string,
  children: React.ReactNode,
  error?: string,
) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
      {label}
    </label>
    {children}
    {error && (
      <p className="text-[11px]" style={{ color: 'var(--error, #f87171)' }}>
        {error}
      </p>
    )}
  </div>
)

const inputCls =
  'w-full px-3 py-2 rounded-xl text-[13px] outline-none border transition-colors'
const inputStyle = {
  background: 'var(--bg-surface)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
}

export function LabRequestForm({
  defaultValues,
  patients,
  doctors,
  onSubmit,
  isSubmitting,
  submitLabel = 'Create Lab Request',
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LabRequestFormValues>({
    resolver: zodResolver(labRequestSchema),
    defaultValues: {
      priority: 'routine',
      tests: [{ test_name: '', value: null, unit: null, reference_range: null, is_abnormal: false, notes: null, sort_order: 0 }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'tests' })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Patient & Doctor */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Request Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field(
            'Patient *',
            <select {...register('patient_id')} className={inputCls} style={inputStyle}>
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.patient_number})
                </option>
              ))}
            </select>,
            errors.patient_id?.message,
          )}
          {field(
            'Requesting Doctor *',
            <select {...register('doctor_id')} className={inputCls} style={inputStyle}>
              <option value="">Select doctor…</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.profiles?.display_name ?? d.id}
                </option>
              ))}
            </select>,
            errors.doctor_id?.message,
          )}
          {field(
            'Priority',
            <select {...register('priority')} className={inputCls} style={inputStyle}>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT</option>
            </select>,
          )}
          {field(
            'Diagnosis / Indication',
            <input
              {...register('diagnosis')}
              className={inputCls}
              style={inputStyle}
              placeholder="Clinical indication…"
            />,
          )}
        </div>
        {field(
          'Clinical Notes',
          <textarea
            {...register('clinical_notes')}
            rows={2}
            className={inputCls}
            style={inputStyle}
            placeholder="Notes for the lab technician…"
          />,
        )}
      </div>

      {/* Tests */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Tests Requested
          </h2>
          <div className="flex gap-2">
            <select
              className="px-3 py-1.5 rounded-lg text-[12px] border outline-none"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  append({
                    test_name: e.target.value,
                    value: null, unit: null, reference_range: null,
                    is_abnormal: false, notes: null,
                    sort_order: fields.length,
                  })
                }
              }}
            >
              <option value="">+ Quick add…</option>
              {COMMON_TESTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => append({
                test_name: '', value: null, unit: null, reference_range: null,
                is_abnormal: false, notes: null, sort_order: fields.length,
              })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Plus size={13} /> Add Test
            </button>
          </div>
        </div>

        {errors.tests?.root && (
          <p className="text-[12px]" style={{ color: 'var(--error, #f87171)' }}>
            {errors.tests.root.message}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {fields.map((f, idx) => (
            <div
              key={f.id}
              className="rounded-xl p-4 flex flex-col gap-3 relative"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <FlaskConical size={13} style={{ color: 'var(--text-muted)' }} />
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Test {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="ml-auto p-1 rounded-lg transition-colors hover:bg-red-500/10"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {field(
                  'Test Name *',
                  <input
                    {...register(`tests.${idx}.test_name`)}
                    className={inputCls}
                    style={inputStyle}
                    placeholder="e.g. Complete Blood Count"
                  />,
                  errors.tests?.[idx]?.test_name?.message,
                )}
                {field(
                  'Unit',
                  <input
                    {...register(`tests.${idx}.unit`)}
                    className={inputCls}
                    style={inputStyle}
                    placeholder="e.g. mg/dL"
                  />,
                )}
                {field(
                  'Reference Range',
                  <input
                    {...register(`tests.${idx}.reference_range`)}
                    className={inputCls}
                    style={inputStyle}
                    placeholder="e.g. 70–100"
                  />,
                )}
                {field(
                  'Notes',
                  <input
                    {...register(`tests.${idx}.notes`)}
                    className={inputCls}
                    style={inputStyle}
                    placeholder="Optional test note…"
                  />,
                )}
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <div
              className="text-center py-8 rounded-xl"
              style={{ border: '1px dashed var(--border)', color: 'var(--text-muted)' }}
            >
              <FlaskConical size={20} className="mx-auto mb-2 opacity-40" />
              <p className="text-[12px]">No tests added yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
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
