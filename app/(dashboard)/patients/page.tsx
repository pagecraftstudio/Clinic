import { Suspense } from 'react'
import { getPatients } from '@/features/patients/queries'
import { PatientsListClient } from './patients-list-client'
import { TableSkeleton } from '@/components/shared/loading-skeleton'

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string; gender?: string; blood_group?: string }>
}

export default async function PatientsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const initial = await getPatients({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    gender: params.gender as never,
    blood_group: params.blood_group as never,
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>Patients</h1>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{initial.total} registered patients</p>
        </div>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <PatientsListClient initialData={initial} initialSearch={params.search ?? ''} />
      </Suspense>
    </div>
  )
}
