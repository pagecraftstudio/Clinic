import { Suspense } from 'react'
import { getVisits } from '@/features/emr/actions'
import { VisitsTable } from '@/components/emr/visits-table'
import { NewVisitButton } from '@/components/emr/new-visit-button'
import { VisitFiltersBar } from '@/components/emr/visit-filters-bar'
import { Skeleton } from '@/components/ui/skeleton'
import type { VisitFilters } from '@/types/emr'

interface PageProps {
  searchParams: Promise<{
    page?: string
    status?: string
    visit_type?: string
    doctor_id?: string
    date_from?: string
    date_to?: string
    search?: string
  }>
}

export const metadata = { title: 'EMR — Visits' }

export default async function EMRPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page ?? 1)

  const filters: VisitFilters = {
    status:     params.status     as VisitFilters['status'],
    doctor_id:  params.doctor_id,
    date_from:  params.date_from,
    date_to:    params.date_to,
    search:     params.search,
  }

  const { data: visits, count } = await getVisits(filters, page)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visits</h1>
          <p className="text-sm text-muted-foreground">
            {count} total visit{count !== 1 ? 's' : ''}
          </p>
        </div>
        <NewVisitButton />
      </div>
      <VisitFiltersBar defaultValues={filters} />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <VisitsTable visits={visits} count={count} page={page} perPage={20} />
      </Suspense>
    </div>
  )
}
