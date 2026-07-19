'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { invoiceSchema, type InvoiceFormValues } from '@/lib/validations/billing'
import { formatCurrency } from '@/lib/utils'
import type { Invoice } from '@/types/billing'

interface Patient {
  id: string
  full_name: string
  patient_number: string
}

interface Doctor {
  id: string
  specialty: string
  profiles: { display_name: string } | null
}

interface InvoiceFormProps {
  patients: Patient[]
  doctors: Doctor[]
  defaultValues?: Partial<InvoiceFormValues>
  onSubmit: (values: InvoiceFormValues) => Promise<void>
  isLoading?: boolean
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', card: 'Card', bank_transfer: 'Bank Transfer',
  vodafone_cash: 'Vodafone Cash', fawry: 'Fawry', insurance: 'Insurance',
}

const DEFAULT_ITEM = { description: '', quantity: 1, unit_price: 0, discount: 0, sort_order: 0 }

export function InvoiceForm({ patients, doctors, defaultValues, onSubmit, isLoading }: InvoiceFormProps) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      status: 'draft',
      discount_type: null,
      discount_value: 0,
      tax_percent: 0,
      items: [{ ...DEFAULT_ITEM }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const watchItems = form.watch('items')
  const watchDiscountType = form.watch('discount_type')
  const watchDiscountValue = form.watch('discount_value') ?? 0
  const watchTax = form.watch('tax_percent') ?? 0

  const subtotal = watchItems.reduce(
    (s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0) - (Number(i.discount) || 0),
    0,
  )
  const discountAmount =
    watchDiscountType === 'percent' ? subtotal * (watchDiscountValue / 100)
    : watchDiscountType === 'flat' ? watchDiscountValue
    : 0
  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * (watchTax / 100)
  const total = afterDiscount + taxAmount

  const input =
    'w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-colors border'
  const inputStyle = {
    background: 'var(--bg-surface)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  }
  const label = 'block text-[11px] font-semibold uppercase tracking-wide mb-1'
  const labelStyle = { color: 'var(--text-muted)' }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Patient + Doctor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={label} style={labelStyle}>Patient *</label>
          <Controller
            control={form.control}
            name="patient_id"
            render={({ field }) => (
              <select {...field} className={input} style={inputStyle}>
                <option value="">Select patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.patient_number})
                  </option>
                ))}
              </select>
            )}
          />
          {form.formState.errors.patient_id && (
            <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>
              {form.formState.errors.patient_id.message}
            </p>
          )}
        </div>

        <div>
          <label className={label} style={labelStyle}>Doctor</label>
          <Controller
            control={form.control}
            name="doctor_id"
            render={({ field }) => (
              <select
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || null)}
                className={input}
                style={inputStyle}
              >
                <option value="">None</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.profiles?.display_name ?? 'Unknown'} — {d.specialty}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div>
          <label className={label} style={labelStyle}>Due Date</label>
          <input
            type="date"
            {...form.register('due_date')}
            className={input}
            style={inputStyle}
          />
        </div>

        <div>
          <label className={label} style={labelStyle}>Status</label>
          <select {...form.register('status')} className={input} style={inputStyle}>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Line Items
          </h3>
          <button
            type="button"
            onClick={() => append({ ...DEFAULT_ITEM })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            <Plus size={13} /> Add Item
          </button>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Description', 'Qty', 'Unit Price', 'Discount', 'Total', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field, idx) => {
                const qty = Number(watchItems[idx]?.quantity) || 0
                const up = Number(watchItems[idx]?.unit_price) || 0
                const disc = Number(watchItems[idx]?.discount) || 0
                const lineTotal = qty * up - disc
                return (
                  <tr
                    key={field.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="last:border-0"
                  >
                    <td className="px-4 py-2">
                      <input
                        {...form.register(`items.${idx}.description`)}
                        placeholder="Service / item description"
                        className="w-full min-w-[180px] px-2 py-1.5 rounded-md text-[13px] outline-none border"
                        style={inputStyle}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        {...form.register(`items.${idx}.quantity`)}
                        className="w-20 px-2 py-1.5 rounded-md text-[13px] outline-none border"
                        style={inputStyle}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register(`items.${idx}.unit_price`)}
                        className="w-28 px-2 py-1.5 rounded-md text-[13px] outline-none border"
                        style={inputStyle}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register(`items.${idx}.discount`)}
                        className="w-24 px-2 py-1.5 rounded-md text-[13px] outline-none border"
                        style={inputStyle}
                      />
                    </td>
                    <td className="px-4 py-2 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(lineTotal)}
                    </td>
                    <td className="px-4 py-2">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="p-1.5 rounded-md transition-colors hover:opacity-70"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {form.formState.errors.items && (
          <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>
            {form.formState.errors.items.message ?? form.formState.errors.items.root?.message}
          </p>
        )}
      </div>

      {/* Totals + Discounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: discount + tax */}
        <div className="space-y-4">
          <div>
            <label className={label} style={labelStyle}>Discount</label>
            <div className="flex gap-2">
              <Controller
                control={form.control}
                name="discount_type"
                render={({ field }) => (
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    className="w-36 px-3 py-2 rounded-lg text-[13px] border outline-none"
                    style={inputStyle}
                  >
                    <option value="">None</option>
                    <option value="flat">Flat (EGP)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                )}
              />
              {watchDiscountType && (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('discount_value')}
                  placeholder={watchDiscountType === 'percent' ? '0%' : '0.00'}
                  className="flex-1 px-3 py-2 rounded-lg text-[13px] border outline-none"
                  style={inputStyle}
                />
              )}
            </div>
          </div>

          <div>
            <label className={label} style={labelStyle}>Tax (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...form.register('tax_percent')}
              className="w-32 px-3 py-2 rounded-lg text-[13px] border outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className={label} style={labelStyle}>Notes</label>
            <textarea
              {...form.register('notes')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-[13px] border outline-none resize-none"
              style={inputStyle}
              placeholder="Optional notes on the invoice…"
            />
          </div>

          <div>
            <label className={label} style={labelStyle}>Insurance Claim #</label>
            <input
              {...form.register('insurance_claim')}
              className={`${input} w-full`}
              style={inputStyle}
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Right: summary */}
        <div
          className="rounded-xl p-5 space-y-3 self-start"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
        >
          {[
            { label: 'Subtotal', value: subtotal },
            discountAmount > 0 && { label: 'Discount', value: -discountAmount },
            taxAmount > 0 && { label: `Tax (${watchTax}%)`, value: taxAmount },
          ]
            .filter(Boolean)
            .map((row: any) => (
              <div key={row.label} className="flex justify-between text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                <span>{row.label}</span>
                <span>{formatCurrency(row.value)}</span>
              </div>
            ))}
          <div
            className="pt-3 mt-3 flex justify-between text-[15px] font-bold"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
        >
          {isLoading ? 'Saving…' : 'Save Invoice'}
        </button>
      </div>
    </form>
  )
}
