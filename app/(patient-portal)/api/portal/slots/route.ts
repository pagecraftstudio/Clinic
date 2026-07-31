import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/features/patient-portal/queries'

export async function GET(req: NextRequest) {
  const doctor = req.nextUrl.searchParams.get('doctor')
  const date   = req.nextUrl.searchParams.get('date')

  if (!doctor || !date) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const slots = await getAvailableSlots(doctor, date)
  return NextResponse.json({ slots })
}
