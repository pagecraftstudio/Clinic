// Append these exports to the existing features/patient-portal/actions.ts

'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { ActionResult } from './actions'

// ── Guest booking ─────────────────────────────────────────────────────────────
const guestBookingSchema = z.object({
  doctor_id:       z.string().uuid(),
  scheduled_at:    z.string().min(1),
  duration:        z.number().int().min(15).max(120).default(30),
  type:            z.enum(['in_person', 'online', 'home_visit']).default('in_person'),
  chief_complaint: z.string().max(500).optional(),
  guest_name:      z.string().min(2).max(100),
  guest_phone:     z.string().min(7).max(30),
  guest_email:     z.string().email().optional(),
})

export async function bookAppointmentAsGuest(
  raw: unknown
): Promise<ActionResult<{ id: string; appointment_number: string }>> {
  const parsed = guestBookingSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const admin = await createAdminClient()

  // Check clinic allows guest booking
  const { data: clinic } = await admin
    .from('clinics')
    .select('id, guest_booking_enabled, booking_approval_required, appointment_duration')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!clinic) return { success: false, error: 'No active clinic found.' }
  if (!clinic.guest_booking_enabled) return { success: false, error: 'Guest booking is not enabled.' }

  const { doctor_id, scheduled_at, type, chief_complaint, guest_name, guest_phone, guest_email } = parsed.data
  const duration = parsed.data.duration ?? clinic.appointment_duration ?? 30
  const scheduledAt = new Date(scheduled_at)
  const endAt = new Date(scheduledAt.getTime() + duration * 60_000)

  const approval_status = clinic.booking_approval_required ? 'pending' : null
  const status = clinic.booking_approval_required ? 'scheduled' : 'scheduled'

  const { data, error } = await admin
    .from('appointments')
    .insert({
      clinic_id:       clinic.id,
      doctor_id,
      patient_id:      null,
      scheduled_at:    scheduledAt.toISOString(),
      end_at:          endAt.toISOString(),
      duration,
      type,
      status,
      chief_complaint: chief_complaint ?? null,
      is_guest:        true,
      guest_name,
      guest_phone,
      guest_email:     guest_email ?? null,
      approval_status,
    })
    .select('id, appointment_number')
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/portal/appointments')
  return { success: true, data: { id: data.id, appointment_number: data.appointment_number } }
}

// ── Reschedule appointment ────────────────────────────────────────────────────
const rescheduleSchema = z.object({
  appointment_id: z.string().uuid(),
  scheduled_at:   z.string().min(1),
})

export async function rescheduleAppointment(raw: unknown): Promise<ActionResult> {
  const parsed = rescheduleSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not signed in.' }

  const admin = await createAdminClient()
  const { data: patient } = await admin.from('patients').select('id').eq('profile_id', user.id).single()
  if (!patient) return { success: false, error: 'Patient record not found.' }

  const { data: appt } = await admin
    .from('appointments')
    .select('id, scheduled_at, duration, doctor_id, clinic_id, status')
    .eq('id', parsed.data.appointment_id)
    .eq('patient_id', patient.id)
    .single()

  if (!appt) return { success: false, error: 'Appointment not found.' }
  if (['cancelled', 'completed', 'no_show'].includes(appt.status)) {
    return { success: false, error: 'Cannot reschedule this appointment.' }
  }

  // Check reschedule window
  const { data: clinic } = await admin
    .from('clinics')
    .select('reschedule_hours')
    .eq('id', appt.clinic_id)
    .single()

  const hoursUntil = (new Date(appt.scheduled_at).getTime() - Date.now()) / 3_600_000
  if (hoursUntil < (clinic?.reschedule_hours ?? 2)) {
    return { success: false, error: `Cannot reschedule within ${clinic?.reschedule_hours ?? 2} hours of appointment.` }
  }

  const newScheduledAt = new Date(parsed.data.scheduled_at)
  const newEndAt = new Date(newScheduledAt.getTime() + appt.duration * 60_000)

  const { error } = await admin
    .from('appointments')
    .update({
      scheduled_at:      newScheduledAt.toISOString(),
      end_at:            newEndAt.toISOString(),
      rescheduled_from:  appt.id,
      status:            'scheduled',
    })
    .eq('id', appt.id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/portal/appointments')
  return { success: true }
}

// ── Join waiting list ─────────────────────────────────────────────────────────
const waitingListSchema = z.object({
  doctor_id:       z.string().uuid(),
  preferred_date:  z.string().min(8),
  preferred_time:  z.enum(['morning', 'afternoon', 'any']).default('any'),
  type:            z.enum(['in_person', 'online', 'home_visit']).default('in_person'),
  chief_complaint: z.string().max(500).optional(),
  // guest fields
  guest_name:  z.string().min(2).max(100).optional(),
  guest_phone: z.string().min(7).max(30).optional(),
})

export async function joinWaitingList(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = waitingListSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const admin = await createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let patientId: string | null = null
  if (user) {
    const { data: p } = await admin.from('patients').select('id').eq('profile_id', user.id).single()
    patientId = p?.id ?? null
  }

  if (!patientId && (!parsed.data.guest_name || !parsed.data.guest_phone)) {
    return { success: false, error: 'Name and phone required for guest waiting list.' }
  }

  const { data: clinic } = await admin
    .from('clinics').select('id').eq('is_active', true).limit(1).single()
  if (!clinic) return { success: false, error: 'No active clinic.' }

  const { data, error } = await admin
    .from('waiting_list')
    .insert({
      clinic_id:       clinic.id,
      doctor_id:       parsed.data.doctor_id,
      patient_id:      patientId,
      guest_name:      patientId ? null : parsed.data.guest_name,
      guest_phone:     patientId ? null : parsed.data.guest_phone,
      preferred_date:  parsed.data.preferred_date,
      preferred_time:  parsed.data.preferred_time,
      type:            parsed.data.type,
      chief_complaint: parsed.data.chief_complaint ?? null,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/portal/appointments')
  return { success: true, data: { id: data.id } }
}

// ── Submit rating ─────────────────────────────────────────────────────────────
const ratingSchema = z.object({
  appointment_id: z.string().uuid(),
  doctor_id:      z.string().uuid(),
  rating:         z.number().int().min(1).max(5),
  comment:        z.string().max(1000).optional(),
  is_anonymous:   z.boolean().default(false),
})

export async function submitDoctorRating(raw: unknown): Promise<ActionResult> {
  const parsed = ratingSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Must be signed in to rate.' }

  const admin = await createAdminClient()
  const { data: patient } = await admin.from('patients').select('id').eq('profile_id', user.id).single()
  if (!patient) return { success: false, error: 'Patient record not found.' }

  const { data: clinic } = await admin
    .from('clinics').select('id, ratings_enabled').limit(1).single()
  if (!clinic?.ratings_enabled) return { success: false, error: 'Ratings are disabled.' }

  // Ensure appointment belongs to patient and is completed
  const { data: appt } = await admin
    .from('appointments')
    .select('id, status')
    .eq('id', parsed.data.appointment_id)
    .eq('patient_id', patient.id)
    .single()

  if (!appt) return { success: false, error: 'Appointment not found.' }
  if (appt.status !== 'completed') return { success: false, error: 'Can only rate completed appointments.' }

  const { error } = await admin
    .from('doctor_ratings')
    .upsert({
      clinic_id:      clinic.id,
      doctor_id:      parsed.data.doctor_id,
      patient_id:     patient.id,
      appointment_id: parsed.data.appointment_id,
      rating:         parsed.data.rating,
      comment:        parsed.data.comment ?? null,
      is_anonymous:   parsed.data.is_anonymous,
    }, { onConflict: 'appointment_id' })

  if (error) return { success: false, error: error.message }

  // Refresh materialized view
  await admin.rpc('refresh_materialized_view', { view_name: 'doctor_rating_summary' }).catch(() => {})

  return { success: true }
}

// ── Admin: approve / reject appointment ──────────────────────────────────────
export async function approveAppointment(
  appointmentId: string,
  action: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not signed in.' }

  const { error } = await supabase
    .from('appointments')
    .update({
      approval_status:   action,
      approved_by:       user.id,
      approved_at:       new Date().toISOString(),
      rejection_reason:  action === 'rejected' ? (rejectionReason ?? null) : null,
      status:            action === 'approved' ? 'confirmed' : 'cancelled',
    })
    .eq('id', appointmentId)
    .not('approval_status', 'eq', 'approved') // idempotent

  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments')
  revalidatePath('/appointments/pending')
  return { success: true }
}
