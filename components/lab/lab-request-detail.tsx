'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FlaskConical, User, Stethoscope, Calendar, Clock,
  CheckCircle2, AlertTriangle, Pencil, Trash2, ChevronRight,
  FileText, ArrowLeft,
} from 'lucide-react'
import { LabStatusBadge, LabPriorityBadge } from './lab-status-badge'
import { LabResultsForm } from './lab-results-form'
import { useUpdateLabResults, useUpdateLabStatus, useDeleteLabRequest } from '@/features/lab/hooks'
import { formatDate } from '@/lib/utils'
import type { LabRequest, LabTestStatus } from '@/types/lab'
import type { LabResultUpdateFormValues } from '@/lib/validations/lab'

interface Props { request: LabRequest }

const STATUS_FLOW: { from: LabTestStatus; to: LabTestStatus; label: string }[] = [
  { from: 'pending',    to: 'collected',  label: 'Mark Collected' },
  { from: 'collected',  to: 'processing', label: 'Mark Processing' },
  { from: 'processing', to: 'completed',  label: 'Mark Completed' },
]

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

export function LabRequestDetail({ request }: Props) {
  const router = useRouter()
  const [enterResults, setEnterResults] = useState(false)
  const updateResults = useUpdateLabResults(request.id)
  const updateStatus = useUpdateLabStatus()
  const deleteRequest = useDeleteLabRequest()

  const nextStep = STATUS_FLOW.find((s) => s.from === request.status)

  async function handleResultsSubmit(data: LabResultUpdateFormValues) {
    const res = await updateResults.mutateAsync(data)
    if (res.success) setEnterResults(false)
  }

  async function handleStatusChange(to: LabTestStatus) {
    await updateStatus.mutateAsync({ id: request.id, status: to })
    if (to === 'completed') setEnterResults(true)
  }

  async function handleDelete() {
    if (!confirm('Delete this lab request? This cannot be undone.')) return
    const res = await deleteRequest.mutateAsync(request.id)
    if (res.success) router.push('/lab')
  }

  const abnormalCount = request.lab_results?.filter((r) => r.is_abnormal).length ?? 0

  return (
    <div className="flex flex-col gap-6 max-w-[960px] mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/lab')}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {request.request_number}
            </h1>
            <LabStatusBadge status={request.status} />
            <LabPriorityBadge priority={request.priority} />
            {abnormalCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/15 text-red-400">
                <AlertTriangle size={10} /> {abnormalCount} Abnormal
              </span>
            )}
          </div>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Requested {formatDate(request.requested_at)}
          </p>
        </div>

        {/* Actions */}
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
          {(request.status === 'processing' || request.status === 'completed') && (
            <button
              onClick={() => setEnterResults((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors"
              style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
            >
              <Pencil size={13} /> {enterResults ? 'Hide Form' : 'Enter Results'}
            </button>
          )}
          {request.status !== 'completed' && (
            <button
              onClick={() => router.push(`/lab/${request.id}/edit`)}
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
                style={{ background: 'var(--accent)/15' }}
              >
                <User size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {request.patients?.full_name ?? '—'}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {request.patients?.patient_number}
                </p>
              </div>
            </div>
            <InfoRow label="Phone" value={request.patients?.phone} />
            <InfoRow label="DOB" value={request.patients?.date_of_birth ? formatDate(request.patients.date_of_birth) : null} />
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-[11px] font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Request Info
            </p>
            <InfoRow label="Doctor" value={request.doctors?.profiles?.display_name} />
            <InfoRow label="Diagnosis" value={request.diagnosis} />
            <InfoRow label="Requested" value={formatDate(request.requested_at)} />
            {request.collected_at && (
              <InfoRow label="Collected" value={formatDate(request.collected_at)} />
            )}
            {request.completed_at && (
              <InfoRow label="Completed" value={formatDate(request.completed_at)} />
            )}
            {request.clinical_notes && (
              <InfoRow label="Notes" value={request.clinical_notes} />
            )}
          </div>
        </div>

        {/* Right: results */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {enterResults ? (
            <LabResultsForm
              request={request}
              onSubmit={handleResultsSubmit}
              isSubmitting={updateResults.isPending}
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
                <FlaskConical size={14} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Test Results
                </h2>
                <span className="ml-auto text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {request.lab_results?.length ?? 0} tests
                </span>
              </div>

              <div style={{ background: 'var(--bg-elevated)' }}>
                {/* Header */}
                <div
                  className="grid grid-cols-12 gap-2 px-5 py-2 text-[11px] font-medium"
                  style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
                >
                  <div className="col-span-4">Test</div>
                  <div className="col-span-2">Result</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-2">Ref. Range</div>
                  <div className="col-span-2">Status</div>
                </div>

                {request.lab_results?.map((r) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-12 gap-2 px-5 py-3 items-center"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: r.is_abnormal ? 'rgb(239 68 68 / 0.05)' : undefined,
                    }}
                  >
                    <div className="col-span-4 text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {r.test_name}
                      {r.notes && (
                        <p className="text-[10px] font-normal mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {r.notes}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 text-[13px] font-semibold" style={{ color: r.is_abnormal ? 'var(--error, #f87171)' : 'var(--text-primary)' }}>
                      {r.value ?? '—'}
                    </div>
                    <div className="col-span-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {r.unit ?? '—'}
                    </div>
                    <div className="col-span-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                      {r.reference_range ?? '—'}
                    </div>
                    <div className="col-span-2">
                      {r.is_abnormal ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-400">
                          <AlertTriangle size={9} /> Abnormal
                        </span>
                      ) : r.value ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400">
                          Normal
                        </span>
                      ) : (
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Pending</span>
                      )}
                    </div>
                  </div>
                ))}

                {(!request.lab_results || request.lab_results.length === 0) && (
                  <div className="px-5 py-10 text-center">
                    <FlaskConical size={20} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>No results yet.</p>
                  </div>
                )}
              </div>

              {request.report_notes && (
                <div
                  className="px-5 py-4"
                  style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}
                >
                  <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    Report Notes
                  </p>
                  <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                    {request.report_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
