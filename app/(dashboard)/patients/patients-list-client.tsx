'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users, LayoutGrid, List as ListIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/shared/search-input'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PatientCard } from '@/components/patients/patient-card'
import { PatientStatusBadge, BloodGroupBadge, GenderBadge } from '@/components/shared/status-badge'
import { usePatients } from '@/features/patients/hooks'
import { formatAge, formatDate, getInitials } from '@/lib/utils'
import type { Patient, PatientFilters } from '@/types/patient'
import { cn } from '@/lib/utils'

interface PatientsListClientProps {
  initialData: { patients: Patient[]; total: number; pageCount: number }
  initialSearch: string
}

export function PatientsListClient({ initialData, initialSearch }: PatientsListClientProps) {
  const router = useRouter()
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [filters, setFilters] = useState<PatientFilters>({ search: initialSearch, page: 1 })

  const { data, isLoading } = usePatients(filters)
  const patients = data?.patients ?? initialData.patients
  const pageCount = data?.pageCount ?? initialData.pageCount

  const columns: Column<Patient>[] = [
    {
      key: 'full_name', header: 'Patient', sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            {getInitials(p.full_name)}
          </div>
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.full_name}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{p.patient_number}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (p) => p.phone },
    { key: 'age', header: 'Age', render: (p) => p.date_of_birth ? `${formatAge(p.date_of_birth)} yrs` : '—' },
    { key: 'gender', header: 'Gender', render: (p) => <GenderBadge gender={p.gender} /> },
    { key: 'blood_group', header: 'Blood', render: (p) => <BloodGroupBadge group={p.blood_group} /> },
    { key: 'status', header: 'Status', render: (p) => <PatientStatusBadge isActive={p.is_active} /> },
    {
      key: 'created_at', header: 'Registered', sortable: true,
      render: (p) => formatDate(p.created_at, 'short'),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SearchInput
          value={filters.search ?? ''}
          onChange={(search) => setFilters((f) => ({ ...f, search, page: 1 }))}
          placeholder="Search by name, phone, national ID…"
        />
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <button
              onClick={() => setView('table')}
              className={cn('p-2', view === 'table' && 'bg-[var(--bg-subtle)]')}
              aria-label="Table view"
            >
              <ListIcon size={14} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <button
              onClick={() => setView('grid')}
              className={cn('p-2', view === 'grid' && 'bg-[var(--bg-subtle)]')}
              aria-label="Grid view"
            >
              <LayoutGrid size={14} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
          <Button onClick={() => router.push('/patients/new')}>
            <Plus size={14} className="mr-1.5" /> New patient
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <DataTable
          columns={columns}
          data={patients}
          rowKey={(p) => p.id}
          isLoading={isLoading}
          onRowClick={(p) => router.push(`/patients/${p.id}`)}
          sortBy={filters.sortBy}
          sortDir={filters.sortDir}
          onSort={(key) => setFilters((f) => ({
            ...f,
            sortBy: key as PatientFilters['sortBy'],
            sortDir: f.sortBy === key && f.sortDir === 'asc' ? 'desc' : 'asc',
          }))}
          emptyIcon={Users}
          emptyTitle="No patients found"
          emptyDescription="Try a different search term or register a new patient."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((p) => <PatientCard key={p.id} patient={p} />)}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}
              className={cn(
                'w-7 h-7 rounded-lg text-[12px] font-medium',
                (filters.page ?? 1) === i + 1 ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-subtle)]'
              )}
              style={{ color: (filters.page ?? 1) === i + 1 ? undefined : 'var(--text-secondary)' }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
