'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireActiveClinicId } from '@/lib/clinic-context'
import { patientSchema, toPatientInsert } from '@/lib/validations/patient'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export async function createPatient(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = patientSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { data: auth } = await supabase.auth.getUser()
  const { cleaned, emergency_contacts } = toPatientInsert(parsed.data)

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({ ...cleaned, clinic_id: clinicId, created_by: auth.user?.id ?? null })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  if (emergency_contacts.length > 0) {
    await supabase.from('patient_emergency_contacts')
      .insert(emergency_contacts.map(c => ({ ...c, patient_id: patient.id })))
  }

  await supabase.from('audit_logs').insert({
    action: 'patient_created',
    table_name: 'patients',
    record_id: patient.id,
    clinic_id: clinicId,
    performed_by: auth.user?.id ?? null,
  })

  revalidatePath('/patients')
  return { success: true, data: { id: patient.id } }
}

export async function updatePatient(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = patientSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { cleaned, emergency_contacts } = toPatientInsert(parsed.data)

  const { error } = await supabase
    .from('patients')
    .update(cleaned)
    .eq('id', id)
    .eq('clinic_id', clinicId)

  if (error) return { success: false, error: error.message }

  if (emergency_contacts.length > 0) {
    await supabase.from('patient_emergency_contacts').delete().eq('patient_id', id)
    await supabase.from('patient_emergency_contacts')
      .insert(emergency_contacts.map(c => ({ ...c, patient_id: id })))
  }

  revalidatePath('/patients')
  revalidatePath(`/patients/${id}`)
  return { success: true }
}

export async function deletePatient(id: string): Promise<ActionResult> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { data: auth } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('patients')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id)
    .eq('clinic_id', clinicId)

  if (error) return { success: false, error: error.message }

  await supabase.from('audit_logs').insert({
    action: 'patient_deleted',
    table_name: 'patients',
    record_id: id,
    clinic_id: clinicId,
    performed_by: auth.user?.id ?? null,
  })

  revalidatePath('/patients')
  return { success: true }
}

export async function bulkDeactivatePatients(ids: string[]): Promise<ActionResult> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { error } = await supabase
    .from('patients')
    .update({ is_active: false })
    .in('id', ids)
    .eq('clinic_id', clinicId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/patients')
  return { success: true }
}

export async function bulkActivatePatients(ids: string[]): Promise<ActionResult> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { error } = await supabase
    .from('patients')
    .update({ is_active: true })
    .in('id', ids)
    .eq('clinic_id', clinicId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/patients')
  return { success: true }
}

export async function bulkDeletePatients(ids: string[]): Promise<ActionResult> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { error } = await supabase
    .from('patients')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .in('id', ids)
    .eq('clinic_id', clinicId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/patients')
  return { success: true }
}
