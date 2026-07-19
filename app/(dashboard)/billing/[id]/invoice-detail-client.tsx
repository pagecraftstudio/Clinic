'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Printer, CreditCard, RotateCcw,
  Trash2, Edit, CheckCircle, XCircle, Send,
} from 'lucide-react'
import { useUpdateInvoiceStatus, useDeleteInvoice, useRecordPayment, useIssueRefund } from '@/features/billing/hooks'
import { PaymentDialog } from '@/components/billing/payment-dialog'
import { RefundDialog } from '@/components/billing/refund-dialog'
import { InvoiceStatusBadge } from '@/components/billing/invoice-status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice } from '@/types/billing'
import type { PaymentFormValues, RefundFormValues } from '@/lib/validations/billing'

interface Props {
  invoice: Invoice
  payments: any[]
  refunds: any[]
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', card: 'Card', bank_transfer: 'Bank Transfer',
  vodafone_cash: 'Vodafone Cash', fawry: 'Fawry', insurance: 'Insurance',
}

export function InvoiceDetailClient({ invoice: initial, payments: initialPayments, refunds: initialRefunds }: Props) {
  const router = useRouter()
  const [showPayment, setShowPayment] = useState(false)
  const [refundTarget, setRefundTarget] = useState<typeof initialPayments[0] | null>(null)

  const updateStatus = useUpdateInvoiceStatus()
  const deleteInvoice = useDeleteInvoice()
  const recordPayment = useRecordPayment()
  const issueRefund = useIssueRefund()

  async function handlePayment(values: PaymentFormValues) {
    const result = await recordPayment.mutateAsync(values)
    if (result.success) {
      setShowPayment(false)
      router.refresh()
    }
  }

  async function handleRefund(values: RefundFormValues) {
    const result = await issueRefund.mutateAsync(values)
    if (result.success) {
      setRefundTarget(null)
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this invoice? This action cannot be undone.')) return
    const result = await deleteInvoice.mutateAsync(initial.id)
    if (result.success) router.push('/billing')
  }

  const card = (children: React.ReactNode, className = '') => (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      {children}
    </div>
  )

  const sectionTitle = (title: string) => (
    <h3
      className="text-[11px] font-semibold uppercase tracking-wide mb-4"
      style={{ color: 'var(--text-muted)' }}
    >
      {title}
    </h3>
  )

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-xl font-bold font-mono"
                style={{ color: 'var(--text-primary)' }}
              >
                {initial.invoice_number}
              </h1>
              <InvoiceStatusBadge status={initial.status} />
            </div>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Issued {formatDate(initial.issued_at)}
              {initial.due_date && ` · Due ${formatDate(initial.due_date)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {initial.status === 'draft' && (
            <button
              onClick={() => updateStatus.mutate({ id: initial.id, status: 'issued' })}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium"
              style={{ background: 'var(--info-light)', color: 'var(--info)' }}
            >
              <Send size={13} /> Issue
            </button>
          )}
          {(initial.status === 'issued' || initial.status === 'partial') && (
            <button
              onClick={() => setShowPayment(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold"
              style={{ background: 'var(--success)', color: '#fff' }}
            >
              <CreditCard size={13} /> Record Payment
            </button>
          )}
          <button
            onClick={() => router.push(`/billing/${initial.id}/edit`)}
            className="p-2 rounded-lg"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}
          >
            <Edit size={15} />
          </button>
          {(initial.status === 'draft' || initial.status === 'issued') && (
            <button
              onClick={() => updateStatus.mutate({ id: initial.id, status: 'cancelled' })}
              className="p-2 rounded-lg"
              style={{ color: 'var(--warning)', background: 'var(--warning-light)' }}
            >
              <XCircle size={15} />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg"
            style={{ color: 'var(--danger)', background: 'var(--danger-light)' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Patient + Doctor */}
          {card(
            <>
              {sectionTitle('Details')}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                    Patient
                  </p>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {initial.patients?.full_name ?? '—'}
                  </p>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {initial.patients?.patient_number}
                  </p>
                  {initial.patients?.phone && (
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {initial.patients.phone}
                    </p>
                  )}
                </div>
                {initial.doctors && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                      Doctor
                    </p>
                    <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {initial.doctors.profiles?.display_name}
                    </p>
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {initial.doctors.specialty}
                    </p>
                  </div>
                )}
              </div>
              {initial.notes && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                    Notes
                  </p>
                  <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                    {initial.notes}
                  </p>
                </div>
              )}
            </>,
          )}

          {/* Line Items */}
          {card(
            <>
              {sectionTitle('Line Items')}
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Description', 'Qty', 'Unit Price', 'Discount', 'Total'].map((h) => (
                      <th
                        key={h}
                        className="pb-2.5 text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(initial.invoice_items ?? [])
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((item) => (
                      <tr
                        key={item.id}
                        style={{ borderBottom: '1px solid var(--border)' }}
                        className="last:border-0"
                      >
                        <td className="py-3 pr-4 text-[13px]" style={{ color: 'var(--text-primary)' }}>
                          {item.description}
                        </td>
                        <td className="py-3 pr-4 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                          {item.quantity}
                        </td>
                        <td className="py-3 pr-4 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-3 pr-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                          {item.discount > 0 ? formatCurrency(item.discount) : '—'}
                        </td>
                        <td className="py-3 text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 pt-4 space-y-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                {[
                  { label: 'Subtotal', value: initial.subtotal },
                  initial.discount_amount > 0 && { label: 'Discount', value: -initial.discount_amount },
                  initial.tax_amount > 0 && { label: `Tax (${initial.tax_percent}%)`, value: initial.tax_amount },
                ]
                  .filter(Boolean)
                  .map((row: any) => (
                    <div
                      key={row.label}
                      className="flex justify-between text-[13px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span>{row.label}</span>
                      <span>{formatCurrency(row.value)}</span>
                    </div>
                  ))}
                <div
                  className="flex justify-between text-[15px] font-bold pt-2"
                  style={{ borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <span>Total</span>
                  <span>{formatCurrency(initial.total)}</span>
                </div>
              </div>
            </>,
          )}

          {/* Payments */}
          {initialPayments.length > 0 &&
            card(
              <>
                {sectionTitle('Payments')}
                <div className="space-y-3">
                  {initialPayments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg px-4 py-3"
                      style={{ background: 'var(--bg-subtle)' }}
                    >
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {METHOD_LABELS[p.method] ?? p.method}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {p.payment_number} · {formatDate(p.paid_at, 'datetime')}
                          {p.reference && ` · Ref: ${p.reference}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-[14px] font-bold"
                          style={{ color: 'var(--success)' }}
                        >
                          {formatCurrency(p.amount)}
                        </span>
                        <button
                          onClick={() => setRefundTarget(p)}
                          className="p-1.5 rounded-md transition-colors hover:opacity-70"
                          style={{ color: 'var(--danger)' }}
                          title="Issue refund"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>,
            )}

          {/* Refunds */}
          {initialRefunds.length > 0 &&
            card(
              <>
                {sectionTitle('Refunds')}
                <div className="space-y-3">
                  {initialRefunds.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg px-4 py-3"
                      style={{ background: 'var(--danger-light)' }}
                    >
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--danger)' }}>
                          Refund — {r.reason}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(r.refunded_at, 'datetime')}
                        </p>
                      </div>
                      <span className="text-[14px] font-bold" style={{ color: 'var(--danger)' }}>
                        -{formatCurrency(r.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </>,
            )}
        </div>

        {/* Right — summary */}
        <div className="flex flex-col gap-4">
          {card(
            <>
              {sectionTitle('Balance')}
              <div className="space-y-3">
                {[
                  { label: 'Invoice Total', value: initial.total, color: 'var(--text-primary)' },
                  { label: 'Paid', value: initial.paid_amount, color: 'var(--success)' },
                  { label: 'Balance Due', value: initial.balance, color: initial.balance > 0 ? 'var(--danger)' : 'var(--text-muted)' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {row.label}
                    </p>
                    <p className="text-[14px] font-bold" style={{ color: row.color }}>
                      {formatCurrency(row.value)}
                    </p>
                  </div>
                ))}
              </div>

              {initial.balance > 0 && (initial.status === 'issued' || initial.status === 'partial') && (
                <button
                  onClick={() => setShowPayment(true)}
                  className="w-full mt-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
                  style={{ background: 'var(--success)', color: '#fff' }}
                >
                  Record Payment
                </button>
              )}
            </>,
          )}

          {initial.insurance_claim && card(
            <>
              {sectionTitle('Insurance')}
              <p className="text-[13px] font-mono" style={{ color: 'var(--text-primary)' }}>
                {initial.insurance_claim}
              </p>
            </>,
          )}
        </div>
      </div>

      {/* Dialogs */}
      {showPayment && (
        <PaymentDialog
          invoice={initial}
          onClose={() => setShowPayment(false)}
          onSubmit={handlePayment}
          isLoading={recordPayment.isPending}
        />
      )}
      {refundTarget && (
        <RefundDialog
          payment={refundTarget}
          invoiceId={initial.id}
          onClose={() => setRefundTarget(null)}
          onSubmit={handleRefund}
          isLoading={issueRefund.isPending}
        />
      )}
    </div>
  )
}
