'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, FileText, Filter,
  TrendingUp, AlertCircle, CheckCircle, Clock,
} from 'lucide-react'
import { useInvoices, useDeleteInvoice, useUpdateInvoiceStatus } from '@/features/billing/hooks'
import { DataTable, type Column } from '@/components/shared/data-table'
import { InvoiceStatusBadge } from '@/components/billing/invoice-status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice, BillingFilters, InvoiceStatus, BillingSummary } from '@/types/billing'

interface BillingClientProps {
  summary: BillingSummary
}

const STATUS_OPTIONS: { value: InvoiceStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function BillingClient({ summary }: BillingClientProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<BillingFilters>({
    page: 1, pageSize: 50, sortBy: 'issued_at', sortDir: 'desc',
  })
  const [search, setSearch] = useState('')
  const { data, isLoading } = useInvoices(filters)
  const deleteInvoice = useDeleteInvoice()
  const updateStatus = useUpdateInvoiceStatus()

  const invoices = data?.data ?? []
  const total = data?.count ?? 0

  function applySearch() {
    setFilters((f) => ({ ...f, search, page: 1 }))
  }

  const columns: Column<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
          {row.invoice_number}
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
      key: 'issued_at',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(row.issued_at)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <InvoiceStatusBadge status={row.status} />,
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (row) => (
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {formatCurrency(row.total)}
        </span>
      ),
    },
    {
      key: 'paid_amount',
      header: 'Paid',
      render: (row) => (
        <span className="text-[13px]" style={{ color: 'var(--success)' }}>
          {formatCurrency(row.paid_amount)}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      sortable: true,
      render: (row) => (
        <span
          className="text-[13px] font-medium"
          style={{ color: row.balance > 0 ? 'var(--danger)' : 'var(--text-muted)' }}
        >
          {row.balance > 0 ? formatCurrency(row.balance) : '—'}
        </span>
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
  ]

  const statCards = [
    {
      label: 'Total Invoiced',
      value: formatCurrency(summary.total_invoiced),
      sub: `${summary.invoice_count} invoices`,
      icon: FileText,
      color: 'var(--accent)',
      bg: 'var(--accent-light)',
    },
    {
      label: 'Collected',
      value: formatCurrency(summary.total_paid),
      sub: `${summary.paid_count} paid`,
      icon: CheckCircle,
      color: 'var(--success)',
      bg: 'var(--success-light)',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(summary.total_outstanding),
      sub: `${summary.partial_count} partial`,
      icon: Clock,
      color: 'var(--warning)',
      bg: 'var(--warning-light)',
    },
    {
      label: 'Overdue',
      value: `${summary.overdue_count}`,
      sub: 'past due date',
      icon: AlertCircle,
      color: 'var(--danger)',
      bg: 'var(--danger-light)',
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Billing
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Invoices, payments & financial records
          </p>
        </div>
        <button
          onClick={() => router.push('/billing/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
          style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
        >
          <Plus size={15} /> New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: card.bg }}
              >
                <card.icon size={15} style={{ color: card.color }} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {card.label}
              </p>
            </div>
            <p className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {card.value}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {card.sub}
            </p>
          </div>
        ))}
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
            placeholder="Search invoice number…"
            className="flex-1 text-[13px] bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <select
          value={filters.status ?? ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: (e.target.value as InvoiceStatus) || undefined, page: 1 }))
          }
          className="px-3 py-2 rounded-xl text-[13px] border outline-none"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.date_from ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined, page: 1 }))}
          className="px-3 py-2 rounded-xl text-[13px] border outline-none"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>to</span>
        <input
          type="date"
          value={filters.date_to ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined, page: 1 }))}
          className="px-3 py-2 rounded-xl text-[13px] border outline-none"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />

        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {total} invoice{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={invoices}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/billing/${row.id}`)}
        sortBy={filters.sortBy}
        sortDir={filters.sortDir}
        onSort={(key) =>
          setFilters((f) => ({
            ...f,
            sortBy: key as BillingFilters['sortBy'],
            sortDir: f.sortBy === key && f.sortDir === 'asc' ? 'desc' : 'asc',
          }))
        }
        emptyIcon={FileText}
        emptyTitle="No invoices"
        emptyDescription="Create your first invoice to get started."
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
