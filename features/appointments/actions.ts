'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireActiveClinicId } from '@/lib/clinic-context'
import { appointmentSchema } from '@/lib/validations/appointment'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export async function createAppointment(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = appointmentSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { data: auth } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('appointments')
    .insert({ ...parsed.data, clinic_id: clinicId, created_by: auth.user?.id })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/appointments')
  revalidatePath('/reception')
  return { success: true, data: { id: data.id } }
}

export async function updateAppointment(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = appointmentSchema.partial().safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { error } = await supabase
    .from('appointments')
    .update(parsed.data)
    .eq('id', id)
    .eq('clinic_id', clinicId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/appointments')
  revalidatePath(`/appointments/${id}`)
  revalidatePath('/reception')
  return { success: true }
}

export async function cancelAppointment(id: string, reason?: string): Promise<ActionResult> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled', cancellation_reason: reason ?? null })
    .eq('id', id)
    .eq('clinic_id', clinicId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/appointments')
  revalidatePath('/reception')
  return { success: true }
}

export async function confirmAppointment(id: string): Promise<ActionResult> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { error } = await supabase.from('appointments')
    .update({ status: 'confirmed' }).eq('id', id).eq('clinic_id', clinicId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments'); revalidatePath(`/appointments/${id}`); revalidatePath('/reception')
  return { success: true }
}

export async function checkInAppointment(id: string): Promise<ActionResult> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { error } = await supabase.from('appointments')
    .update({ status: 'checked_in' }).eq('id', id).eq('clinic_id', clinicId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments'); revalidatePath(`/appointments/${id}`); revalidatePath('/reception')
  return { success: true }
}

export async function startAppointment(id: string): Promise<ActionResult> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { error } = await supabase.from('appointments')
    .update({ status: 'in_progress' }).eq('id', id).eq('clinic_id', clinicId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments'); revalidatePath(`/appointments/${id}`); revalidatePath('/reception')
  return { success: true }
}

export async function completeAppointment(id: string): Promise<ActionResult> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { error } = await supabase.from('appointments')
    .update({ status: 'completed' }).eq('id', id).eq('clinic_id', clinicId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments'); revalidatePath(`/appointments/${id}`); revalidatePath('/reception')
  return { success: true }
}

export async function markNoShow(id: string): Promise<ActionResult> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { error } = await supabase.from('appointments')
    .update({ status: 'no_show' }).eq('id', id).eq('clinic_id', clinicId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments'); revalidatePath(`/appointments/${id}`); revalidatePath('/reception')
  return { success: true }
}

export async function deleteAppointment(id: string): Promise<ActionResult> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { error } = await supabase.from('appointments')
    .update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('clinic_id', clinicId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments'); revalidatePath('/reception')
  return { success: true }
}

export async function rescheduleAppointment(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = appointmentSchema.partial().safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { error } = await supabase.from('appointments')
    .update({ ...parsed.data, status: 'rescheduled', rescheduled_from: id }).eq('id', id).eq('clinic_id', clinicId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments'); revalidatePath(`/appointments/${id}`); revalidatePath('/reception')
  return { success: true }
}

// ── Approve from waiting list → create real appointment ───────────────────────
export async function approveFromWaitingList(raw: {
  waiting_list_id: string
  doctor_id: string
  patient_id: string | null
  guest_name: string | null
  guest_phone: string | null

  scheduled_at: string    // full ISO datetime e.g. "2025-08-01T09:30:00"
  duration: number
  type: string
  chief_complaint: string | null
}): Promise<ActionResult<{ appointment_id: string }>> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])

  // Conflict check — same doctor, overlapping window, not cancelled/deleted
  const start = new Date(raw.scheduled_at)
  const end   = new Date(start.getTime() + raw.duration * 60000)

  const { data: conflicts } = await supabase
    .from('appointments')
    .select('id, scheduled_at, end_at')
    .eq('doctor_id', raw.doctor_id)
    .eq('clinic_id', clinicId)
    .is('deleted_at', null)
    .not('status', 'in', '(cancelled,no_show)')
    .lt('scheduled_at', end.toISOString())
    .gt('end_at',       start.toISOString())

  if (conflicts && conflicts.length > 0) {
    const clash = conflicts[0]
    const clashTime = new Date(clash.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    return { success: false, error: `Time conflicts with an existing appointment at ${clashTime}` }
  }

  // If no patient_id this is a guest — require guest fields
  if (!raw.patient_id && !raw.guest_name) {
    return { success: false, error: 'Guest name required.' }
  }

  // Build insert — patient_id is nullable for guests
  const insertData: Record<string, unknown> = {
    clinic_id:       clinicId,
    doctor_id:       raw.doctor_id,
    scheduled_at:    raw.scheduled_at,
    duration:        raw.duration,
    type:            raw.type as 'in_person' | 'online' | 'follow_up' | 'urgent' | 'routine',
    chief_complaint: raw.chief_complaint,
    status:          'scheduled',
    is_online:       raw.type === 'online',
    is_guest:        !raw.patient_id,
    guest_name:      raw.guest_name,
    guest_phone:     raw.guest_phone,

  }
  if (raw.patient_id) insertData.patient_id = raw.patient_id

  const { data: appt, error: apptErr } = await supabase
    .from('appointments')
    .insert(insertData)
    .select('id')
    .single()

  if (apptErr) return { success: false, error: apptErr.message }

  // Mark waiting list entry as booked
  await supabase
    .from('waiting_list')
    .update({ status: 'booked' })
    .eq('id', raw.waiting_list_id)

  revalidatePath('/appointments')
  revalidatePath('/appointments/waiting-list')
  revalidatePath('/reception')
  revalidatePath('/portal/appointments')

  return { success: true, data: { appointment_id: appt.id } }
}
