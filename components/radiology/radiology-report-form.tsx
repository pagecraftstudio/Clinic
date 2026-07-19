'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { radiologyReportSchema, type RadiologyReportFormValues } from '@/lib/validations/radiology'
import type { RadiologyOrder } from '@/types/radiology'

interface Props {
  order: RadiologyOrder
  onSubmit: (data: RadiologyReportFormValues) => Promise<void>
  isSubmitting?: boolean
}

const inputCls = 'w-full px-3 py-2 rounded-xl text-[13px] outline-none border transition-colors'
const inputStyle = {
  background: 'var(--bg-surface)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
}

export function RadiologyReportForm({ order, onSubmit, isSubmitting }: Props) {
  const { register, handleSubmit } = useForm<RadiologyReportFormValues>({
    resolver: zodResolver(radiologyReportSchema),
    defaultValues: {
      findings: order.findings ?? '',
      impression: order.impression ?? '',
      scheduled_at: order.scheduled_at ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Radiology Report
        </h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            Scheduled Date/Time
          </label>
          <input
            {...register('scheduled_at')}
            type="datetime-local"
            className={inputCls}
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            Findings
          </label>
          <textarea
            {...register('findings')}
            rows={5}
            className={inputCls}
            style={inputStyle}
            placeholder="Describe the imaging findings in detail…"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            Impression / Conclusion
          </label>
          <textarea
            {...register('impression')}
            rows={3}
            className={inputCls}
            style={inputStyle}
            placeholder="Summary and diagnostic impression…"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-60"
          style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
        >
          {isSubmitting ? 'Saving…' : 'Save Report'}
        </button>
      </div>
    </form>
  )
}
