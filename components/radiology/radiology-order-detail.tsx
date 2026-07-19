'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Scan, User, Stethoscope, Calendar, CheckCircle2,
  Pencil, Trash2, ArrowLeft, Clock,
} from 'lucide-react'
import { RadiologyStatusBadge } from './radiology-status-badge'
import { RadiologyReportForm } from './radiology-report-form'
import { RadiologyAttachmentPanel } from './radiology-attachment-panel'
import {
  useUpdateRadiologyReport,
  useUpdateRadiologyStatus,
  useDeleteRadiologyOrder,
} from '@/features/radiology/hooks'
import { formatDate } from '@/lib/utils'
import type { RadiologyOrder, RadiologyStatus } from '@/types/radiology'
import type { RadiologyReportFormValues } from '@/lib/validations/radiology'

interface Props { order: RadiologyOrder }

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-[11px] font-medium w-32 shrink-0 pt-0.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
        {value ?? '—'}
      </span>
    </div>
  )
}

const STATUS_FLOW: { from: RadiologyStatus; to: RadiologyStatus; label: string }[] = [
  { from: 'requested', to: 'scheduled',  label: 'Mark Scheduled' },
  { from: 'scheduled', to: 'completed',  label: 'Mark Completed' },
]

export function RadiologyOrderDetail({ order }: Props) {
  const router = useRouter()
  const [showReport, setShowReport] = useState(false)
  const updateReport = useUpdateRadiologyReport(order.id)
  const updateStatus = useUpdateRadiologyStatus()
  const deleteOrder = useDeleteRadiologyOrder()

  const nextStep = STATUS_FLOW.find((s) => s.from === order.status)

  async function handleReportSubmit(data: RadiologyReportFormValues) {
    const res = await updateReport.mutateAsync(data)
    if (res.success) setShowReport(false)
  }

  async function handleStatusChange(to: RadiologyStatus) {
    await updateStatus.mutateAsync({ id: order.id, status: to })
    if (to === 'completed') setShowReport(true)
  }

  async function handleDelete() {
    if (!confirm('Delete this radiology order? This cannot be undone.')) return
    const res = await deleteOrder.mutateAsync(order.id)
    if (res.success) router.push('/radiology')
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/radiology')}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {order.order_number}
            </h1>
            <RadiologyStatusBadge status={order.status} />
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ background: 'var(--accent)/10', color: 'var(--accent)' }}
            >
              {order.radiology_types?.name ?? '—'}
            </span>
          </div>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Requested {formatDate(order.requested_at)}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {nextStep && (
            <button
              onClick={() => handleStatusChange(nextStep.to)}
              disabled={updateStatus.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium border transition-colors disabled:opacity-60"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <CheckCircle2 size={13} /> {nextStep.label}
            </button>
          )}
          <button
            onClick={() => setShowReport((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors"
            style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
          >
            <Pencil size={13} /> {showReport ? 'Hide Report' : 'Enter Report'}
          </button>
          {order.status !== 'completed' && (
            <button
              onClick={() => router.push(`/radiology/${order.id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Pencil size={13} /> Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--error, #f87171)' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: info */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-[11px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Patient
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
              >
                <User size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {order.patients?.full_name ?? '—'}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {order.patients?.patient_number}
                </p>
              </div>
            </div>
            <InfoRow label="Phone" value={order.patients?.phone} />
            <InfoRow label="DOB" value={order.patients?.date_of_birth ? formatDate(order.patients.date_of_birth) : null} />
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-[11px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Order Info
            </p>
            <InfoRow label="Doctor" value={order.doctors?.profiles?.display_name} />
            <InfoRow label="Scan Type" value={order.radiology_types?.name} />
            <InfoRow label="Body Part" value={order.body_part} />
            <InfoRow label="Requested" value={formatDate(order.requested_at)} />
            {order.scheduled_at && (
              <InfoRow label="Scheduled" value={formatDate(order.scheduled_at, 'datetime')} />
            )}
            {order.completed_at && (
              <InfoRow label="Completed" value={formatDate(order.completed_at)} />
            )}
            {order.clinical_info && (
              <InfoRow label="Clinical Info" value={order.clinical_info} />
            )}
          </div>
        </div>

        {/* Right: report + attachments */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {showReport ? (
            <RadiologyReportForm
              order={order}
              onSubmit={handleReportSubmit}
              isSubmitting={updateReport.isPending}
            />
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)' }}
            >
              <div
                className="px-5 py-4 flex items-center gap-2"
                style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
              >
                <Scan size={14} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Radiology Report
                </h2>
              </div>
              <div className="px-5 py-5 flex flex-col gap-4" style={{ background: 'var(--bg-elevated)' }}>
                {order.findings || order.impression ? (
                  <>
                    {order.findings && (
                      <div>
                        <p className="text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Findings
                        </p>
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                          {order.findings}
                        </p>
                      </div>
                    )}
                    {order.impression && (
                      <div>
                        <p className="text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Impression
                        </p>
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                          {order.impression}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Scan size={20} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      No report entered yet. Click "Enter Report" to add findings.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <RadiologyAttachmentPanel
            orderId={order.id}
            attachments={order.radiology_attachments ?? []}
          />
        </div>
      </div>
    </div>
  )
}
