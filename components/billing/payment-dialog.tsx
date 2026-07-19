'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, CreditCard } from 'lucide-react'
import { paymentSchema, type PaymentFormValues } from '@/lib/validations/billing'
import { formatCurrency } from '@/lib/utils'
import type { Invoice } from '@/types/billing'

const METHODS = [
  { value: 'cash',          label: 'Cash' },
  { value: 'card',          label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'vodafone_cash', label: 'Vodafone Cash' },
  { value: 'fawry',         label: 'Fawry' },
  { value: 'insurance',     label: 'Insurance' },
] as const

interface PaymentDialogProps {
  invoice: Invoice
  onClose: () => void
  onSubmit: (values: PaymentFormValues) => Promise<void>
  isLoading?: boolean
}

export function PaymentDialog({ invoice, onClose, onSubmit, isLoading }: PaymentDialogProps) {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice_id: invoice.id,
      amount: invoice.balance,
      method: 'cash',
      paid_at: new Date().toISOString().slice(0, 16),
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
              style={{ background: 'var(--success-light)' }}
            >
              <CreditCard size={16} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Record Payment
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {invoice.invoice_number} · Balance: {formatCurrency(invoice.balance)}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={label} style={labelStyle}>Amount (EGP) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={invoice.balance}
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
            <label className={label} style={labelStyle}>Payment Method *</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => {
                const selected = form.watch('method') === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => form.setValue('method', m.value)}
                    className="px-3 py-2 rounded-lg text-[12px] font-medium transition-all border"
                    style={{
                      background: selected ? 'var(--accent)' : 'var(--bg-subtle)',
                      color: selected ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      borderColor: selected ? 'var(--accent)' : 'var(--border)',
                    }}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className={label} style={labelStyle}>Reference / Transaction ID</label>
            <input
              {...form.register('reference')}
              placeholder="Optional"
              className={input}
              style={inputStyle}
            />
          </div>

          <div>
            <label className={label} style={labelStyle}>Date & Time</label>
            <input
              type="datetime-local"
              {...form.register('paid_at')}
              className={input}
              style={inputStyle}
            />
          </div>

          <div>
            <label className={label} style={labelStyle}>Notes</label>
            <textarea
              {...form.register('notes')}
              rows={2}
              className={`${input} resize-none`}
              style={inputStyle}
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-[13px] font-medium border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50"
              style={{ background: 'var(--success)', color: '#fff' }}
            >
              {isLoading ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
