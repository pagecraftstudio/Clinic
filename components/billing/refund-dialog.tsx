'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, RotateCcw } from 'lucide-react'
import { refundSchema, type RefundFormValues } from '@/lib/validations/billing'
import { formatCurrency } from '@/lib/utils'

interface Payment {
  id: string
  payment_number: string
  amount: number
}

interface RefundDialogProps {
  payment: Payment
  invoiceId: string
  onClose: () => void
  onSubmit: (values: RefundFormValues) => Promise<void>
  isLoading?: boolean
}

export function RefundDialog({ payment, invoiceId, onClose, onSubmit, isLoading }: RefundDialogProps) {
  const form = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      payment_id: payment.id,
      invoice_id: invoiceId,
      amount: payment.amount,
      reason: '',
    },
  })

  const input = 'w-full px-3 py-2 rounded-lg text-[13px] border outline-none transition-colors'
  const inputStyle = {
    background: 'var(--bg-surface)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  }
  const label = 'block text-[11px] font-semibold uppercase tracking-wide mb-1'
  const labelStyle = { color: 'var(--text-muted)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--danger-light)' }}
            >
              <RotateCcw size={16} style={{ color: 'var(--danger)' }} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Issue Refund
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {payment.payment_number} · {formatCurrency(payment.amount)}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={label} style={labelStyle}>Refund Amount (EGP) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={payment.amount}
              {...form.register('amount')}
              className={input}
              style={inputStyle}
            />
            {form.formState.errors.amount && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <label className={label} style={labelStyle}>Reason *</label>
            <textarea
              {...form.register('reason')}
              rows={3}
              className={`${input} resize-none`}
              style={inputStyle}
              placeholder="Reason for refund…"
            />
            {form.formState.errors.reason && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          <div
            className="rounded-lg p-3 text-[12px]"
            style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
          >
            This will reduce the invoice paid amount and update its status accordingly.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-[13px] font-medium border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold disabled:opacity-50"
              style={{ background: 'var(--danger)', color: '#fff' }}
            >
              {isLoading ? 'Processing…' : 'Issue Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
