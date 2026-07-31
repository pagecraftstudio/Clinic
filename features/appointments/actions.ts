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
