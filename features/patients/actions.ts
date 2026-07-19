'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { patientSchema, toPatientInsert } from '@/lib/validations/patient'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export async function createPatient(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = patientSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const { cleaned, emergency_contacts } = toPatientInsert(parsed.data)

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({ ...cleaned, created_by: auth.user?.id ?? null })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  if (emergency_contacts.length > 0) {
    const { error: contactError } = await supabase
      .from('patient_emergency_contacts')
      .insert(emergency_contacts.map((c) => ({ ...c, patient_id: patient.id })))
    if (contactError) return { success: false, error: contactError.message }
  }

  await supabase.from('audit_logs').insert({
    action: 'patient_created',
    table_name: 'patients',
    record_id: patient.id,
    performed_by: auth.user?.id ?? null,
  })

  revalidatePath('/patients')
  return { success: true, data: { id: patient.id } }
}

export async function updatePatient(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = patientSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { cleaned, emergency_contacts } = toPatientInsert(parsed.data)

  const { error } = await supabase.from('patients').update(cleaned).eq('id', id)
  if (error) return { success: false, error: error.message }

  // Replace emergency contacts wholesale — simplest correct behavior for a small list.
  await supabase.from('patient_emergency_contacts').delete().eq('patient_id', id)
  if (emergency_contacts.length > 0) {
    const { error: contactError } = await supabase
      .from('patient_emergency_contacts')
      .insert(emergency_contacts.map((c) => ({ ...c, patient_id: id })))
    if (contactError) return { success: false, error: contactError.message }
  }

  revalidatePath('/patients')
  revalidatePath(`/patients/${id}`)
  return { success: true }
}

// Soft delete only — medical records are never hard-deleted.
export async function deactivatePatient(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('patients')
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/patients')
  return { success: true }
}

export async function reactivatePatient(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('patients')
    .update({ is_active: true, deleted_at: null })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/patients')
  return { success: true }
}

export async function createPatientAndRedirect(raw: unknown) {
  const result = await createPatient(raw)
  if (result.success && result.data) redirect(`/patients/${result.data.id}`)
  return result
}

export async function uploadPatientDocument(
  patientId: string,
  formData: FormData
): Promise<ActionResult> {
  const file = formData.get('file') as File | null
  const type = (formData.get('type') as string) ?? 'other'
  const notes = formData.get('notes') as string | null
  if (!file || file.size === 0) return { success: false, error: 'No file provided' }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const path = `${patientId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('patient-documents')
    .upload(path, file, { contentType: file.type })
  if (uploadError) return { success: false, error: uploadError.message }

  const { data: publicUrl } = supabase.storage.from('patient-documents').getPublicUrl(path)

  const { error } = await supabase.from('patient_documents').insert({
    patient_id: patientId,
    type,
    name: file.name,
    file_url: publicUrl.publicUrl,
    file_size: file.size,
    mime_type: file.type,
    notes,
    uploaded_by: auth.user?.id ?? null,
  })
  if (error) return { success: false, error: error.message }

  revalidatePath(`/patients/${patientId}`)
  return { success: true }
}
