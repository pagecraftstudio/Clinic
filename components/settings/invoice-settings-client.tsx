'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Receipt, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { updateClinicSettings } from '@/features/settings/actions'
import { clinicSettingsSchema } from '@/lib/validations/settings'
import type { ClinicSettings } from '@/types/settings'

interface Props { settings: ClinicSettings | null }

export function InvoiceSettingsClient({ settings }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(clinicSettingsSchema.pick({
      invoice_prefix: true,
      invoice_notes: true,
      invoice_footer: true,
      name: true,
    })),
    defaultValues: {
      name: settings?.name ?? 'My Clinic',
      invoice_prefix: settings?.invoice_prefix ?? 'INV',
      invoice_notes: settings?.invoice_notes ?? '',
      invoice_footer: settings?.invoice_footer ?? '',
    },
  })

  const watchedPrefix = watch('invoice_prefix')
  const watchedNotes = watch('invoice_notes')
  const watchedFooter = watch('invoice_footer')

  function onSubmit(data: any) {
    setError(null)
    setSuccess(false)
    // Merge with existing settings
    const merged = {
      ...settings,
      ...data,
    }
    startTransition(async () => {
      const result = await updateClinicSettings(merged)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error ?? 'Failed to save')
      }
    })
  }

  const sampleNumber = `${watchedPrefix || 'INV'}-000001`

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Invoice Configuration</h2>
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className={cn(
            'flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg transition-colors',
            previewMode
              ? 'bg-blue-600 text-white'
              : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]'
          )}
        >
          <Eye size={12} />
          Preview
        </button>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-5', previewMode ? 'col-span-2' : 'col-span-5')}>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Receipt size={14} className="text-[var(--text-muted)]" />
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Numbering</h3>
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-[var(--text-muted)]">Invoice Prefix</Label>
              <Input
                {...register('invoice_prefix')}
                placeholder="INV"
                className={inputCls}
                maxLength={10}
              />
              {errors.invoice_prefix && (
                <p className="text-[11px] text-red-400">{errors.invoice_prefix.message as string}</p>
              )}
              <p className="text-[11px] text-[var(--text-muted)]">
                Example invoice number: <span className="font-mono">{sampleNumber}</span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5 space-y-4">
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Invoice Content</h3>
            <div className="space-y-1">
              <Label className="text-[12px] text-[var(--text-muted)]">Notes (shown on invoice)</Label>
              <Textarea
                {...register('invoice_notes')}
                rows={3}
                placeholder="Payment is due within 30 days. Thank you for choosing us."
                className="bg-[var(--bg-subtle)] border-[var(--border)] text-white placeholder:text-[var(--text-muted)]/50 focus:border-blue-500/50 text-[13px] resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-[var(--text-muted)]">Footer</Label>
              <Textarea
                {...register('invoice_footer')}
                rows={2}
                placeholder="Licensed by Ministry of Health. License #12345"
                className="bg-[var(--bg-subtle)] border-[var(--border)] text-white placeholder:text-[var(--text-muted)]/50 focus:border-blue-500/50 text-[13px] resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save size={14} />
              {isPending ? 'Saving…' : 'Save Changes'}
            </Button>
            {success && <span className="text-[13px] text-emerald-400">Saved successfully</span>}
            {error && <span className="text-[13px] text-red-400">{error}</span>}
          </div>
        </form>

        {/* Preview */}
        {previewMode && (
          <div className="col-span-3">
            <div className="rounded-xl border border-[var(--border)] bg-white text-gray-900 p-6 text-[12px] shadow-xl">
              {/* Invoice header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-bold text-[18px] text-gray-900">{settings?.name ?? 'My Clinic'}</p>
                  {settings?.address && <p className="text-gray-500">{settings.address}</p>}
                  {settings?.phone && <p className="text-gray-500">{settings.phone}</p>}
                  {settings?.email && <p className="text-gray-500">{settings.email}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-[22px] text-gray-400 uppercase tracking-wide">Invoice</p>
                  <p className="font-mono text-gray-700 mt-1">{sampleNumber}</p>
                  <p className="text-gray-500 mt-0.5">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-4" />

              {/* Patient block */}
              <div className="mb-6">
                <p className="text-gray-400 uppercase text-[10px] font-semibold tracking-wide mb-1">Bill To</p>
                <p className="font-semibold text-gray-800">Ahmed Mohamed</p>
                <p className="text-gray-500">PT-000001</p>
              </div>

              {/* Items table */}
              <table className="w-full mb-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-3 text-gray-500 font-semibold">Service</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-semibold">Qty</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-semibold">Price</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-100">
                    <td className="py-2 px-3 text-gray-800">Consultation</td>
                    <td className="py-2 px-3 text-right text-gray-600">1</td>
                    <td className="py-2 px-3 text-right text-gray-600">500 EGP</td>
                    <td className="py-2 px-3 text-right font-semibold text-gray-800">500 EGP</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-48 space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span><span>500 EGP</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (0%)</span><span>0 EGP</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                    <span>Total</span><span>500 EGP</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {watchedNotes && (
                <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-gray-600">{watchedNotes}</p>
                </div>
              )}

              {/* Footer */}
              {watchedFooter && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center text-gray-400">
                  {watchedFooter}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const inputCls = 'bg-[var(--bg-subtle)] border-[var(--border)] text-white placeholder:text-[var(--text-muted)]/50 focus:border-blue-500/50 h-9 text-[13px]'
