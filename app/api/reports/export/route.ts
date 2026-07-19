import { NextRequest, NextResponse } from 'next/server'
import {
  getRevenueReport,
  getAppointmentsReport,
  getPatientsReport,
  getInventoryReport,
  getLabReport,
  getRadiologyReport,
} from '@/features/reports/queries'

function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const v = row[h] ?? ''
        const s = String(v).replace(/"/g, '""')
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
      }).join(',')
    ),
  ]
  return lines.join('\n')
}

function buildCSV(tab: string, data: any): string {
  if (!data) return ''

  if (tab === 'revenue') {
    return [
      '# Summary',
      toCSV([data.summary]),
      '',
      '# Daily Revenue',
      toCSV(data.daily),
      '',
      '# By Payment Method',
      toCSV(data.byMethod),
      '',
      '# By Doctor',
      toCSV(data.byDoctor),
    ].join('\n')
  }

  if (tab === 'appointments') {
    return [
      '# Summary',
      toCSV([data.summary]),
      '',
      '# Daily',
      toCSV(data.daily),
      '',
      '# By Status',
      toCSV(data.byStatus),
      '',
      '# By Type',
      toCSV(data.byType),
      '',
      '# By Doctor',
      toCSV(data.byDoctor),
    ].join('\n')
  }

  if (tab === 'patients') {
    return [
      '# Summary',
      toCSV([data.summary]),
      '',
      '# Daily Registrations',
      toCSV(data.daily),
      '',
      '# By Gender',
      toCSV(data.byGender),
      '',
      '# By Blood Group',
      toCSV(data.byBloodGroup),
      '',
      '# By City',
      toCSV(data.byCity),
    ].join('\n')
  }

  if (tab === 'inventory') {
    return [
      '# Summary',
      toCSV([data.summary]),
      '',
      '# Low Stock Items',
      toCSV(data.lowStock),
      '',
      '# Expiring Soon',
      toCSV(data.expiringSoon),
      '',
      '# Expired Items',
      toCSV(data.expired),
      '',
      '# By Category',
      toCSV(data.byCategory),
    ].join('\n')
  }

  if (tab === 'lab') {
    return [
      '# Summary',
      toCSV([data.summary]),
      '',
      '# By Status',
      toCSV(data.byStatus),
      '',
      '# Top Tests',
      toCSV(data.topTests),
    ].join('\n')
  }

  if (tab === 'radiology') {
    return [
      '# Summary',
      toCSV([data.summary]),
      '',
      '# By Status',
      toCSV(data.byStatus),
      '',
      '# By Modality',
      toCSV(data.byModality),
    ].join('\n')
  }

  return ''
}

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

    const csv = buildCSV(tab, data)
    const filename = `report-${tab}-${from}-${to}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error('Export error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
