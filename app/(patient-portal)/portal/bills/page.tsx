import { redirect } from 'next/navigation'
import { getPortalPatient, getPatientInvoices } from '@/features/patient-portal/queries'
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export const metadata = { title: 'My Bills' }

const STATUS_STYLE: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  paid:         { icon: CheckCircle, color: '#059669', bg: '#ECFDF5', label: 'Paid' },
  draft:        { icon: Clock,       color: 'var(--text-muted)', bg: 'var(--bg-subtle)', label: 'Draft' },
  sent:         { icon: Clock,       color: '#6366F1', bg: '#EEF2FF', label: 'Pending' },
  partial:      { icon: AlertCircle, color: '#D97706', bg: '#FFFBEB', label: 'Partial' },
  overdue:      { icon: AlertCircle, color: 'var(--danger)', bg: 'var(--danger-light)', label: 'Overdue' },
  cancelled:    { icon: AlertCircle, color: 'var(--text-muted)', bg: 'var(--bg-subtle)', label: 'Cancelled' },
  refunded:     { icon: CheckCircle, color: 'var(--text-muted)', bg: 'var(--bg-subtle)', label: 'Refunded' },
}

function formatCurrency(amount: number, currency: string) {
  return `${amount.toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function PatientBillsPage() {
  const patient = await getPortalPatient()
  if (!patient) redirect('/portal/login')

  const invoices = await getPatientInvoices(patient.id)

  const totalOwed = invoices
    .filter(inv => !['paid', 'cancelled', 'refunded'].includes(inv.status))
    .reduce((sum, inv) => sum + (inv.balance ?? 0), 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Bills</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {patient.full_name} · #{patient.patient_number}
        </p>
      </div>

      {/* Summary strip */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <SummaryCard label="Total invoices" value={String(invoices.length)} />
          <SummaryCard
            label="Outstanding"
            value={totalOwed > 0 ? formatCurrency(totalOwed, invoices[0]?.currency ?? 'EGP') : '—'}
            highlight={totalOwed > 0}
          />
          <SummaryCard
            label="Paid"
            value={String(invoices.filter(i => i.status === 'paid').length)}
          />
        </div>
      )}

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <FileText size={32} className="mx-auto mb-3 opacity-30" />
          <p style={{ fontSize: 14 }}>No bills yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {invoices.map((inv: any) => {
            const s = STATUS_STYLE[inv.status] ?? STATUS_STYLE.draft
            const Icon = s.icon
            return (
              <div key={inv.id} className="rounded-xl p-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: s.bg }}>
                      <Icon size={15} style={{ color: s.color }} />
                    </div>
                    <div className="min-w-0">
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Invoice #{inv.invoice_number}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                        Issued {formatDate(inv.issued_at)}
                        {inv.due_date ? ` · Due ${formatDate(inv.due_date)}` : ''}
                      </div>

                      {/* Line items summary */}
                      {inv.invoice_items?.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {inv.invoice_items.slice(0, 3).map((item: any, i: number) => (
                            <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {item.description} × {item.quantity}
                            </div>
                          ))}
                          {inv.invoice_items.length > 3 && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              +{inv.invoice_items.length - 3} more items
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span style={{ fontSize: 15, fontWeight: 700 }}>
                      {formatCurrency(inv.total, inv.currency)}
                    </span>
                    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99 }}>
                      {s.label}
                    </span>
                    {inv.balance > 0 && inv.status !== 'paid' && (
                      <span style={{ fontSize: 11, color: 'var(--danger)' }}>
                        Balance: {formatCurrency(inv.balance, inv.currency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-6 text-center" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        To pay or dispute a bill, please contact the clinic directly.
      </p>
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
