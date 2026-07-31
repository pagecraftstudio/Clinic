'use client'

import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useLang } from '@/lib/i18n/context'

const STATUS_ICONS: Record<string, any> = {
  paid: CheckCircle, draft: Clock, sent: Clock, partial: AlertCircle, overdue: AlertCircle, cancelled: AlertCircle, refunded: CheckCircle,
}
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  paid:      { color: '#059669', bg: '#ECFDF5' },
  draft:     { color: 'var(--text-muted)', bg: 'var(--bg-subtle)' },
  sent:      { color: '#6366F1', bg: '#EEF2FF' },
  partial:   { color: '#D97706', bg: '#FFFBEB' },
  overdue:   { color: 'var(--danger)', bg: 'var(--danger-light)' },
  cancelled: { color: 'var(--text-muted)', bg: 'var(--bg-subtle)' },
  refunded:  { color: 'var(--text-muted)', bg: 'var(--bg-subtle)' },
}

export function BillsClient({ patient, invoices }: { patient: any; invoices: any[] }) {
  const { tr, isRtl, lang } = useLang()
  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB'

  const totalOwed = invoices
    .filter(inv => !['paid', 'cancelled', 'refunded'].includes(inv.status))
    .reduce((sum, inv) => sum + (inv.balance ?? 0), 0)

  function formatCurrency(amount: number, currency: string) {
    return `${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
  }
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{tr.myBills}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {patient.full_name} · #{patient.patient_number}
        </p>
      </div>

      {invoices.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <SummaryCard label={tr.invoice} value={String(invoices.length)} />
          <SummaryCard
            label={tr.balance}
            value={totalOwed > 0 ? formatCurrency(totalOwed, invoices[0]?.currency ?? 'EGP') : '—'}
            highlight={totalOwed > 0}
          />
          <SummaryCard label={tr.paid} value={String(invoices.filter(i => i.status === 'paid').length)} />
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <FileText size={32} className="mx-auto mb-3 opacity-30" />
          <p style={{ fontSize: 14 }}>{tr.noBills}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {invoices.map((inv: any) => {
            const sc = STATUS_COLORS[inv.status] ?? STATUS_COLORS.draft
            const Icon = STATUS_ICONS[inv.status] ?? Clock
            const statusLabel = (tr.billStatus as any)[inv.status] ?? inv.status
            return (
              <div key={inv.id} className="rounded-xl p-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: sc.bg }}>
                      <Icon size={15} style={{ color: sc.color }} />
                    </div>
                    <div className="min-w-0">
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{tr.invoice} #{inv.invoice_number}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                        {tr.issued} {formatDate(inv.issued_at)}
                        {inv.due_date ? ` · ${tr.due} ${formatDate(inv.due_date)}` : ''}
                      </div>
                      {inv.invoice_items?.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {inv.invoice_items.slice(0, 3).map((item: any, i: number) => (
                            <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {item.description} × {item.quantity}
                            </div>
                          ))}
                          {inv.invoice_items.length > 3 && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{inv.invoice_items.length - 3}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{formatCurrency(inv.total, inv.currency)}</span>
                    <span style={{ background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99 }}>
                      {statusLabel}
                    </span>
                    {inv.balance > 0 && inv.status !== 'paid' && (
                      <span style={{ fontSize: 11, color: 'var(--danger)' }}>
                        {tr.balance}: {formatCurrency(inv.balance, inv.currency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: `1px solid ${highlight ? 'var(--danger)' : 'var(--border)'}` }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: highlight ? 'var(--danger)' : 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}
