import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    const admin = await createAdminClient()
    const { data: patient, error: patientError } = await admin
      .from('patients')
      .select('id, full_name, profile_id')
      .eq('profile_id', user?.id ?? '')
      .single()

    const { data: clinic, error: clinicError } = await admin
      .from('clinics')
      .select('id, name')
      .limit(1)
      .single()

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      userError: userError?.message,
      patient,
      patientError: patientError?.message,
      clinic,
      clinicError: clinicError?.message,
    })
  } catch (e: any) {
    return NextResponse.json({ crashed: e.message }, { status: 500 })
  }
}
