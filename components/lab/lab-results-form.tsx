'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { labResultUpdateSchema, type LabResultUpdateFormValues } from '@/lib/validations/lab'
import type { LabRequest } from '@/types/lab'

interface Props {
  request: LabRequest
  onSubmit: (data: LabResultUpdateFormValues) => Promise<void>
  isSubmitting?: boolean
}

const inputCls =
  'w-full px-3 py-2 rounded-xl text-[13px] outline-none border transition-colors'
const inputStyle = {
  background: 'var(--bg-surface)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
}

export function LabResultsForm({ request, onSubmit, isSubmitting }: Props) {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<LabResultUpdateFormValues>({
    resolver: zodResolver(labResultUpdateSchema),
    defaultValues: {
      report_notes: request.report_notes ?? '',
      tests: request.lab_results?.map((r) => ({
        test_name: r.test_name,
        value: r.value ?? '',
        unit: r.unit ?? '',
        reference_range: r.reference_range ?? '',
        is_abnormal: r.is_abnormal,
        notes: r.notes ?? '',
        sort_order: r.sort_order,
      })) ?? [],
    },
  })

  const { fields } = useFieldArray({ control, name: 'tests' })
  const testsWatch = watch('tests')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Results table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        <div
          className="px-5 py-4"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Enter Results
          </h2>
        </div>

        <div style={{ background: 'var(--bg-elevated)' }}>
          {/* Header row */}
          <div
            className="grid grid-cols-12 gap-2 px-5 py-2 text-[11px] font-medium"
            style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="col-span-3">Test</div>
            <div className="col-span-2">Result</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-2">Ref. Range</div>
            <div className="col-span-1 text-center">Abnormal</div>
            <div className="col-span-2">Notes</div>
          </div>

          {fields.map((f, idx) => {
            const isAbnormal = testsWatch?.[idx]?.is_abnormal
            return (
              <div
                key={f.id}
                className="grid grid-cols-12 gap-2 px-5 py-3 items-center"
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: isAbnormal ? 'rgb(239 68 68 / 0.05)' : undefined,
                }}
              >
                <div className="col-span-3">
                  <p className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {f.test_name}
                  </p>
                </div>
                <div className="col-span-2">
                  <input
                    {...register(`tests.${idx}.value`)}
                    className={inputCls}
                    style={inputStyle}
                    placeholder="—"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    {...register(`tests.${idx}.unit`)}
                    className={inputCls}
                    style={inputStyle}
                    placeholder="unit"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    {...register(`tests.${idx}.reference_range`)}
                    className={inputCls}
                    style={inputStyle}
                    placeholder="e.g. 4–10"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <input
                    type="checkbox"
                    {...register(`tests.${idx}.is_abnormal`)}
                    className="w-4 h-4 rounded"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    {...register(`tests.${idx}.notes`)}
                    className={inputCls}
                    style={inputStyle}
                    placeholder="note…"
                  />
                </div>
              </div>
            )
          })}

          {fields.length === 0 && (
            <div className="px-5 py-8 text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
              No tests in this request.
            </div>
          )}
        </div>
      </div>

      {/* Report notes */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-3"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          Report / Interpretation Notes
        </label>
        <textarea
          {...register('report_notes')}
          rows={3}
          className={inputCls}
          style={inputStyle}
          placeholder="Overall findings, interpretation, recommendations…"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-60"
          style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
        >
          {isSubmitting ? 'Saving…' : 'Save Results'}
        </button>
      </div>
    </form>
  )
}
