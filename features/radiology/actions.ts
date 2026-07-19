'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { radiologyOrderSchema, radiologyReportSchema } from '@/lib/validations/radiology'
import type { RadiologyStatus } from '@/types/radiology'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export async function createRadiologyOrder(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = radiologyOrderSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('radiology_orders')
    .insert({
      ...parsed.data,
      order_number: 'RAD-TMP',
      status: 'requested',
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/radiology')
  return { success: true, data: { id: data.id } }
}

export async function updateRadiologyOrder(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = radiologyOrderSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('radiology_orders')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/radiology')
  revalidatePath(`/radiology/${id}`)
  return { success: true }
}

export async function updateRadiologyReport(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = radiologyReportSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('radiology_orders')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/radiology')
  revalidatePath(`/radiology/${id}`)
  return { success: true }
}

export async function updateRadiologyStatus(id: string, status: RadiologyStatus): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const updates: Record<string, unknown> = { status }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
    updates.technician_id = auth.user?.id ?? null
  }

  const { error } = await supabase
    .from('radiology_orders')
    .update(updates)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/radiology')
  revalidatePath(`/radiology/${id}`)
  return { success: true }
}

export async function deleteRadiologyOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('radiology_orders').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/radiology')
  return { success: true }
}

export async function uploadRadiologyAttachment(
  orderId: string,
  file: FormData,
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const f = file.get('file') as File | null
  if (!f) return { success: false, error: 'No file provided' }

  const ext = f.name.split('.').pop()
  const path = `${orderId}/${Date.now()}.${ext}`
  const isDicom = ext?.toLowerCase() === 'dcm'

  const { error: uploadError } = await supabase.storage
    .from('radiology')
    .upload(path, f, { contentType: f.type || 'application/octet-stream' })

  if (uploadError) return { success: false, error: uploadError.message }

  const { data: urlData } = supabase.storage.from('radiology').getPublicUrl(path)

  const { error: dbError } = await supabase.from('radiology_attachments').insert({
    order_id: orderId,
    name: f.name,
    file_url: urlData.publicUrl,
    mime_type: f.type || null,
    is_dicom: isDicom,
    uploaded_by: auth.user?.id ?? null,
  })

  if (dbError) return { success: false, error: dbError.message }

  revalidatePath(`/radiology/${orderId}`)
  return { success: true, data: { url: urlData.publicUrl } }
}

export async function deleteRadiologyAttachment(attachmentId: string, orderId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('radiology_attachments')
    .delete()
    .eq('id', attachmentId)
  if (error) return { success: false, error: error.message }
  revalidatePath(`/radiology/${orderId}`)
  return { success: true }
}
