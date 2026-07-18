'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { appointmentSchema, rescheduleSchema, cancelSchema } from '@/lib/validations/appointment'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

// ── Create ──────────────────────────────────────────────────
export async function createAppointment(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = appointmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...parsed.data,
      online_link: parsed.data.online_link || null,
      booked_by: auth.user?.id ?? null,
      status: 'scheduled',
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  await supabase.from('audit_logs').insert({
    action: 'appointment_created',
    table_name: 'appointments',
    record_id: data.id,
    performed_by: auth.user?.id ?? null,
  })

  revalidatePath('/appointments')
  return { success: true, data: { id: data.id } }
}

// ── Update ───────────────────────────────────────────────────
export async function updateAppointment(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = appointmentSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ ...parsed.data, online_link: parsed.data.online_link || null })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return { success: false, error: error.message }

  revalidatePath('/appointments')
  revalidatePath(`/appointments/${id}`)
  return { success: true }
}

// ── Status transitions ───────────────────────────────────────
export async function checkInAppointment(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments')
  return { success: true }
}

export async function startAppointment(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'in_progress' })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments')
  return { success: true }
}

export async function completeAppointment(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'completed', checked_out_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments')
  revalidatePath(`/appointments/${id}`)
  return { success: true }
}

export async function markNoShow(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'no_show' })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments')
  return { success: true }
}

export async function confirmAppointment(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments')
  return { success: true }
}

// ── Reschedule ───────────────────────────────────────────────
export async function rescheduleAppointment(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = rescheduleSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ ...parsed.data, status: 'rescheduled' })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments')
  revalidatePath(`/appointments/${id}`)
  return { success: true }
}

// ── Cancel ───────────────────────────────────────────────────
export async function cancelAppointment(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = cancelSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: parsed.data.cancellation_reason,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments')
  revalidatePath(`/appointments/${id}`)
  return { success: true }
}

// ── Soft delete ──────────────────────────────────────────────
export async function deleteAppointment(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/appointments')
  return { success: true }
}
