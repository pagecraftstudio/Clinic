import { NextRequest, NextResponse } from 'next/server'
import {
  getRevenueReport,
  getAppointmentsReport,
  getPatientsReport,
  getInventoryReport,
  getLabReport,
  getRadiologyReport,
} from '@/features/reports/queries'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const tab = searchParams.get('tab') ?? 'revenue'
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
  }

  try {
    let data: any = null
    if (tab === 'revenue') data = await getRevenueReport({ from, to })
    else if (tab === 'appointments') data = await getAppointmentsReport({ from, to })
    else if (tab === 'patients') data = await getPatientsReport({ from, to })
    else if (tab === 'inventory') data = await getInventoryReport()
    else if (tab === 'lab') data = await getLabReport({ from, to })
    else if (tab === 'radiology') data = await getRadiologyReport({ from, to })
    else return NextResponse.json({ error: 'Unknown tab' }, { status: 400 })

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Reports API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
