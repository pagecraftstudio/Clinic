import { format, subDays } from 'date-fns'
import { ReportsClient } from '@/components/reports/reports-client'
import {
  getRevenueReport,
  getAppointmentsReport,
  getPatientsReport,
  getInventoryReport,
  getLabReport,
  getRadiologyReport,
} from '@/features/reports/queries'
import type { ReportTab } from '@/types/reports'

export const metadata = { title: 'Reports' }

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const tab = (params.tab ?? 'revenue') as ReportTab
  const to = params.to ?? format(new Date(), 'yyyy-MM-dd')
  const from = params.from ?? format(subDays(new Date(), 30), 'yyyy-MM-dd')

  let initialData: any = null
  try {
    if (tab === 'revenue') initialData = await getRevenueReport({ from, to })
    else if (tab === 'appointments') initialData = await getAppointmentsReport({ from, to })
    else if (tab === 'patients') initialData = await getPatientsReport({ from, to })
    else if (tab === 'inventory') initialData = await getInventoryReport()
    else if (tab === 'lab') initialData = await getLabReport({ from, to })
    else if (tab === 'radiology') initialData = await getRadiologyReport({ from, to })
  } catch (err) {
    console.error('Reports error:', err)
    initialData = null
  }

  return (
    <ReportsClient
      initialTab={tab}
      initialData={initialData}
      initialFrom={from}
      initialTo={to}
    />
  )
}
