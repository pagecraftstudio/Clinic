import { createClient } from '@/lib/supabase/server'

// ── Patient identity ──────────────────────────────────────────────────────────

export async function getPortalPatient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('patients')
    .select('id, full_name, patient_number, phone, date_of_birth, gender, blood_group, allergies')
    .eq('profile_id', user.id)
    .single()

  return data ?? null
}

// ── Doctors list (public — for booking) ──────────────────────────────────────

export async function getPortalDoctors() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('doctors')
    .select(`
      id,
      specialty,
      consultation_fee,
      profiles (
        display_name,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .order('specialty')
  return data ?? []
}

// ── Appointments for current patient ─────────────────────────────────────────

export async function getPatientAppointments(patientId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_number,
      scheduled_at,
      end_at,
      duration,
      type,
      status,
      chief_complaint,
      is_online,
      online_link,
      doctors (
        id,
        specialty,
        profiles ( display_name, avatar_url )
      )
    `)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(50)
  return data ?? []
}

// ── Bills / invoices for current patient ─────────────────────────────────────

export async function getPatientInvoices(patientId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      issued_at,
      due_date,
      status,
      total,
      paid_amount,
      balance,
      currency,
      notes,
      invoice_items ( description, quantity, unit_price, total )
    `)
    .eq('patient_id', patientId)
    .is('deleted_at', null)
    .order('issued_at', { ascending: false })
    .limit(50)
  return data ?? []
}

// ── Clinic settings (public — for landing page) ───────────────────────────────

export async function getPortalClinicSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clinic_settings')
    .select('name, name_ar, tagline, phone, email, address, city, logo_url, working_hours_start, working_hours_end, working_days')
    .limit(1)
    .single()
  return data ?? null
}
