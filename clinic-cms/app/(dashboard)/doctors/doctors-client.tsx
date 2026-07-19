'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, SlidersHorizontal, Stethoscope, Video, Users, UserCheck } from 'lucide-react'
import { useDoctors, useSpecialties } from '@/features/doctors/hooks'
import { DoctorCard } from '@/components/doctors/doctor-card'
import type { DoctorFilters } from '@/types/doctor'
import { cn } from '@/lib/utils'

export function DoctorsClient() {
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined)
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12

  const filters: DoctorFilters = {
    search: search || undefined,
    specialty: specialty || undefined,
    is_active: isActive,
    accepts_online: onlineOnly || undefined,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isLoading, refetch } = useDoctors(filters)
  const { data: specialties = [] } = useSpecialties()

  const doctors = data?.data ?? []
  const total   = data?.count ?? 0
  const pages   = Math.ceil(total / PAGE_SIZE)

  const activeCount  = doctors.filter((d) => d.is_active).length
  const onlineCount  = doctors.filter((d) => d.accepts_online).length

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Doctors</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {total} doctor{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/doctors/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="size-4" />
          Add Doctor
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Users className="size-4" />} label="Total" value={total} />
        <StatCard icon={<UserCheck className="size-4 text-emerald-500" />} label="Active" value={doctors.filter(d => d.is_active).length} accent="emerald" />
        <StatCard icon={<Video className="size-4 text-sky-500" />} label="Online" value={doctors.filter(d => d.accepts_online).length} accent="sky" />
        <StatCard icon={<Stethoscope className="size-4 text-violet-500" />} label="Specialties" value={specialties.length} accent="violet" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search specialty, license…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[var(--surface-muted)]"
          />
        </div>

        {/* Specialty */}
        <select
          value={specialty}
          onChange={(e) => { setSpecialty(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-[var(--surface-muted)] text-[var(--text-primary)]"
        >
          <option value="">All specialties</option>
          {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Status filter pills */}
        <div className="flex gap-2">
          {([
            [undefined, 'All'],
            [true, 'Active'],
            [false, 'Inactive'],
          ] as [boolean | undefined, string][]).map(([val, label]) => (
            <button
              key={label}
              onClick={() => { setIsActive(val); setPage(1) }}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive === val
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Online toggle */}
        <button
          onClick={() => { setOnlineOnly((o) => !o); setPage(1) }}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            onlineOnly
              ? 'bg-sky-100 text-sky-700'
              : 'bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
          )}
        >
          <Video className="size-4" /> Online
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-[var(--surface-muted)] animate-pulse" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState onAdd={() => {}} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {doctors.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} onMutate={refetch} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--surface-muted)] transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 rounded-lg text-sm border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--surface-muted)] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm px-4 py-3 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-[var(--surface-muted)]">{icon}</div>
      <div>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-2xl">
      <Stethoscope className="size-12 mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">No doctors yet</h3>
      <p className="text-sm text-[var(--text-muted)] mb-6">Add your first doctor to get started</p>
      <Link
        href="/doctors/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Plus className="size-4" /> Add Doctor
      </Link>
    </div>
  )
}
