'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Book appointment ──────────────────────────────────────────────────────────

const bookingSchema = z.object({
  doctor_id: z.string().uuid(),
  scheduled_at: z.string().min(1),   // ISO datetime string
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

  // Get current authenticated patient
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'You must be signed in to book an appointment.' }
  }

  // Resolve patient record for this user (linked via profile_id → profiles → auth.users)
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (patientError || !patient) {
    return { success: false, error: 'Patient record not found. Please contact the clinic.' }
  }

  const scheduledAt = new Date(parsed.data.scheduled_at)
  const endAt = new Date(scheduledAt.getTime() + parsed.data.duration * 60_000)

  const { data, error } = await supabase
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

export async function cancelPatientAppointment(appointmentId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not signed in.' }

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!patient) return { success: false, error: 'Patient record not found.' }

  // Verify ownership
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, scheduled_at, status')
    .eq('id', appointmentId)
    .eq('patient_id', patient.id)
    .single()

  if (!appt) return { success: false, error: 'Appointment not found.' }
  if (appt.status === 'cancelled') return { success: false, error: 'Already cancelled.' }

  // Only allow cancelling future appointments
  if (new Date(appt.scheduled_at) < new Date()) {
    return { success: false, error: 'Cannot cancel past appointments.' }
  }

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: 'Cancelled by patient' })
    .eq('id', appointmentId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/portal/appointments')
  return { success: true }
}
