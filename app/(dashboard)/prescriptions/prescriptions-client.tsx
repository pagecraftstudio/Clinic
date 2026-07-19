'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pill } from 'lucide-react'
import { usePrescriptions, useDeletePrescription } from '@/features/prescriptions/hooks'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PrescriptionStatusBadge } from '@/components/prescriptions/prescription-status-badge'
import { formatDate } from '@/lib/utils'
import type { Prescription, PrescriptionFilters } from '@/types/prescription'

export function PrescriptionsClient() {
  const router = useRouter()
  const [filters, setFilters] = useState<PrescriptionFilters>({ page: 1, pageSize: 50 })
  const [search, setSearch] = useState('')
  const { data, isLoading } = usePrescriptions(filters)
  const deletePrescription = useDeletePrescription()

  const prescriptions = data?.data ?? []
  const total = data?.count ?? 0

  function applySearch() {
    setFilters((f) => ({ ...f, search, page: 1 }))
  }

  const columns: Column<Prescription>[] = [
    {
      key: 'prescription_number',
      header: 'Rx #',
      render: (row) => (
        <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
          {row.prescription_number}
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
      key: 'medicines',
      header: 'Medicines',
      render: (row) => {
        const items = row.prescription_items ?? []
        return (
          <div>
            <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
              {items[0]?.medicine_name ?? '—'}
              {items.length > 1 && (
                <span className="ml-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  +{items.length - 1} more
                </span>
              )}
            </p>
          </div>
        )
      },
    },
    {
      key: 'prescribed_at',
      header: 'Date',
      render: (row) => (
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(row.prescribed_at)}
        </span>
      ),
    },
    {
      key: 'valid_until',
      header: 'Valid Until',
      render: (row) => (
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          {row.valid_until ? formatDate(row.valid_until) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <PrescriptionStatusBadge
          status={
            row.is_dispensed
              ? 'dispensed'
              : row.valid_until && row.valid_until < new Date().toISOString().split('T')[0]
                ? 'expired'
                : 'active'
          }
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Prescriptions
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Manage and track patient prescriptions
          </p>
        </div>
        <button
          onClick={() => router.push('/prescriptions/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
          style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
        >
          <Plus size={15} /> New Prescription
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
            placeholder="Search by Rx number…"
            className="flex-1 text-[13px] bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <select
          value={typeof filters.is_dispensed === 'boolean' ? String(filters.is_dispensed) : ''}
          onChange={(e) => {
            const v = e.target.value
            setFilters((f) => ({
              ...f,
              is_dispensed: v === '' ? undefined : v === 'true',
              page: 1,
            }))
          }}
          className="px-3 py-2 rounded-xl text-[13px] border outline-none"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="">All Statuses</option>
          <option value="false">Active</option>
          <option value="true">Dispensed</option>
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
          {total} prescription{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={prescriptions}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/prescriptions/${row.id}`)}
        emptyIcon={Pill}
        emptyTitle="No prescriptions"
        emptyDescription="Create your first prescription to get started."
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
