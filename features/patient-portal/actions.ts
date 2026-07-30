'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Register patient ──────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>

export async function registerPatient(raw: unknown): Promise<ActionResult<{ userId: string }>> {
  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const { email, password, firstName, lastName, phone, dateOfBirth, gender } = parsed.data

  // Use admin client to bypass RLS for signup + patient insert
  const admin = await createAdminClient()

  // 1. Create auth user (email already confirmed — no email verification needed for portal)
  const { data: authData, error: signUpError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      role: 'patient',
    },
  })

  if (signUpError) {
    return { success: false, error: signUpError.message }
  }

  const userId = authData.user?.id
  if (!userId) {
    return { success: false, error: 'Registration failed. Please try again.' }
  }

  // 2. Wait for DB trigger to create profile row
  let profileExists = false
  for (let i = 0; i < 10; i++) {
    const { data: p } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    if (p) { profileExists = true; break }
    await new Promise(r => setTimeout(r, 300))
  }
  if (!profileExists) {
    return { success: false, error: 'Account setup timed out. Please try signing in.' }
  }

  // 3. Get first active clinic (admin client bypasses clinics RLS)
  const { data: clinicData } = await admin
    .from('clinics')
    .select('id')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!clinicData?.id) {
    return { success: false, error: 'No active clinic found. Please contact support.' }
  }

  // 4. Insert patient record (admin client bypasses patients RLS)
  const { error: patientError } = await admin
    .from('patients')
    .insert({
      profile_id: userId,
      clinic_id: clinicData.id,
      first_name: firstName,
      last_name: lastName,
      phone,
      email,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      blood_group: 'unknown',
      country: 'Egypt',
      language_pref: 'ar',
      is_active: true,
    })

  if (patientError) {
    const isDuplicate = patientError.message.includes('duplicate') || patientError.message.includes('unique')
    if (!isDuplicate) {
      return { success: false, error: patientError.message }
    }
  }

  return { success: true, data: { userId } }
}

// ── Book appointment ──────────────────────────────────────────────────────────

const bookingSchema = z.object({
  doctor_id: z.string().uuid(),
  scheduled_at: z.string().min(1),
  duration: z.number().int().min(15).max(120).default(30),
  type: z.enum(['in_person', 'online', 'home_visit']).default('in_person'),
  chief_complaint: z.string().max(500).optional(),
})

export type BookingInput = z.infer<typeof bookingSchema>

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export async function bookAppointment(raw: unknown): Promise<ActionResult<{ id: string; appointment_number: string }>> {
  const parsed = bookingSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'You must be signed in to book an appointment.' }
  }

  // Use admin client to bypass RLS for patient lookup + appointment insert
  const admin = await createAdminClient()

  const { data: patient, error: patientError } = await admin
    .from('patients')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (patientError || !patient) {
    return { success: false, error: 'Patient record not found. Please contact the clinic.' }
  }

  const scheduledAt = new Date(parsed.data.scheduled_at)
  const endAt = new Date(scheduledAt.getTime() + parsed.data.duration * 60_000)

  const { data, error } = await admin
    .from('appointments')
    .insert({
      patient_id: patient.id,
      doctor_id: parsed.data.doctor_id,
      scheduled_at: scheduledAt.toISOString(),
      end_at: endAt.toISOString(),
      duration: parsed.data.duration,
      type: parsed.data.type,
      status: 'scheduled',
      chief_complaint: parsed.data.chief_complaint ?? null,
      booked_by: user.id,
    })
    .select('id, appointment_number')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/portal/appointments')
  return { success: true, data: { id: data.id, appointment_number: data.appointment_number } }
}

// ── Cancel appointment ────────────────────────────────────────────────────────

export async function cancelPatientAppointment(appointmentId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not signed in.' }

  const admin = await createAdminClient()

  const { data: patient } = await admin
    .from('patients')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!patient) return { success: false, error: 'Patient record not found.' }

  const { data: appt } = await admin
    .from('appointments')
    .select('id, scheduled_at, status')
    .eq('id', appointmentId)
    .eq('patient_id', patient.id)
    .single()

  if (!appt) return { success: false, error: 'Appointment not found.' }
  if (appt.status === 'cancelled') return { success: false, error: 'Already cancelled.' }

  if (new Date(appt.scheduled_at) < new Date()) {
    return { success: false, error: 'Cannot cancel past appointments.' }
  }

  const { error } = await admin
    .from('appointments')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: 'Cancelled by patient' })
    .eq('id', appointmentId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/portal/appointments')
  return { success: true }
}
