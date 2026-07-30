import { createClient, createAdminClient } from '@/lib/supabase/server'

// ── Patient identity ──────────────────────────────────────────────────────────

export async function getPortalPatient() {
  // Get the current user from the regular client (validates session)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Use admin client to fetch patient record — bypasses RLS so patients
  // can always read their own row regardless of role/policy state
  const admin = await createAdminClient()
  const { data } = await admin
    .from('patients')
    .select('id, full_name, patient_number, phone, date_of_birth, gender, blood_group, allergies')
    .eq('profile_id', user.id)
    .single()

  return data ?? null
}

// ── Doctors list (public — for booking) ──────────────────────────────────────

export async function getPortalDoctors() {
  // Admin client so unauthenticated / patient users can see doctors list
  const admin = await createAdminClient()
  const { data } = await admin
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
  const admin = await createAdminClient()
  const { data } = await admin
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
  const admin = await createAdminClient()
  const { data } = await admin
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
  // Admin client so patients and unauthenticated visitors can see clinic info
  const admin = await createAdminClient()
  const { data } = await admin
    .from('clinics')
    .select('name, name_ar, tagline, tagline_ar, phone, phone_alt, email, address, address_ar, city, logo_url, working_hours_start, working_hours_end, working_days, primary_color, whatsapp_number, whatsapp_enabled')
    .limit(1)
    .single()
  return data ?? null
}
