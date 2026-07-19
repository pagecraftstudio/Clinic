'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, FlaskConical } from 'lucide-react'
import { useLabRequests, useDeleteLabRequest } from '@/features/lab/hooks'
import { DataTable, type Column } from '@/components/shared/data-table'
import { LabStatusBadge, LabPriorityBadge } from '@/components/lab/lab-status-badge'
import { formatDate } from '@/lib/utils'
import type { LabRequest, LabFilters, LabTestStatus, LabTestPriority } from '@/types/lab'

export function LabClient() {
  const router = useRouter()
  const [filters, setFilters] = useState<LabFilters>({ page: 1, pageSize: 50 })
  const [search, setSearch] = useState('')
  const { data, isLoading } = useLabRequests(filters)
  const deleteRequest = useDeleteLabRequest()

  const requests = data?.data ?? []
  const total = data?.count ?? 0

  function applySearch() {
    setFilters((f) => ({ ...f, search, page: 1 }))
  }

  const columns: Column<LabRequest>[] = [
    {
      key: 'request_number',
      header: 'Request #',
      render: (row) => (
        <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
          {row.request_number}
        </span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (row) => (
        <div>
          <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {row.patients?.full_name ?? '—'}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {row.patients?.patient_number}
          </p>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Doctor',
      render: (row) => (
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          {row.doctors?.profiles?.display_name ?? '—'}
        </span>
      ),
    },
    {
      key: 'tests',
      header: 'Tests',
      render: (row) => {
        const results = row.lab_results ?? []
        const abnormal = results.filter((r) => r.is_abnormal).length
        return (
          <div>
            <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
              {results[0]?.test_name ?? '—'}
              {results.length > 1 && (
                <span className="ml-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  +{results.length - 1} more
                </span>
              )}
            </p>
            {abnormal > 0 && (
              <p className="text-[10px] mt-0.5 text-red-400">
                {abnormal} abnormal
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <LabPriorityBadge priority={row.priority} />,
    },
    {
      key: 'requested_at',
      header: 'Date',
      render: (row) => (
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(row.requested_at)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <LabStatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Laboratory
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Manage lab requests and results
          </p>
        </div>
        <button
          onClick={() => router.push('/lab/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
          style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
        >
          <Plus size={15} /> New Request
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[220px] max-w-sm"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            placeholder="Search by request number…"
            className="flex-1 text-[13px] bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as LabTestStatus) || undefined, page: 1 }))}
          className="px-3 py-2 rounded-xl text-[13px] border outline-none"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="collected">Collected</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filters.priority ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, priority: (e.target.value as LabTestPriority) || undefined, page: 1 }))}
          className="px-3 py-2 rounded-xl text-[13px] border outline-none"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="">All Priorities</option>
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="stat">STAT</option>
        </select>

        <input
          type="date"
          value={filters.date_from ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined, page: 1 }))}
          className="px-3 py-2 rounded-xl text-[13px] border outline-none"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>to</span>
        <input
          type="date"
          value={filters.date_to ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined, page: 1 }))}
          className="px-3 py-2 rounded-xl text-[13px] border outline-none"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />

        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {total} request{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={requests}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/lab/${row.id}`)}
        emptyIcon={FlaskConical}
        emptyTitle="No lab requests"
        emptyDescription="Create your first lab request to get started."
      />

      {/* Pagination */}
      {total > (filters.pageSize ?? 50) && (
        <div className="flex items-center justify-between">
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Page {filters.page} of {Math.ceil(total / (filters.pageSize ?? 50))}
          </p>
          <div className="flex gap-2">
            <button
              disabled={(filters.page ?? 1) <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              className="px-3 py-1.5 rounded-lg text-[12px] border disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Prev
            </button>
            <button
              disabled={(filters.page ?? 1) >= Math.ceil(total / (filters.pageSize ?? 50))}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              className="px-3 py-1.5 rounded-lg text-[12px] border disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
