'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { labRequestSchema, labResultUpdateSchema } from '@/lib/validations/lab'
import type { LabTestStatus } from '@/types/lab'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export async function createLabRequest(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = labRequestSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { tests, ...rest } = parsed.data

  const { data: request, error } = await supabase
    .from('lab_requests')
    .insert({
      ...rest,
      request_number: 'LB-TMP', // trigger overwrites
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  const testRows = tests.map((t, i) => ({
    ...t,
    lab_request_id: request.id,
    sort_order: t.sort_order ?? i,
  }))

  const { error: testsError } = await supabase
    .from('lab_results')
    .insert(testRows)

  if (testsError) {
    await supabase.from('lab_requests').delete().eq('id', request.id)
    return { success: false, error: testsError.message }
  }

  revalidatePath('/lab')
  return { success: true, data: { id: request.id } }
}

export async function updateLabResults(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = labResultUpdateSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { tests, report_notes } = parsed.data

  const { error } = await supabase
    .from('lab_requests')
    .update({ report_notes })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  // replace results
  await supabase.from('lab_results').delete().eq('lab_request_id', id)

  const testRows = tests.map((t, i) => ({
    ...t,
    lab_request_id: id,
    sort_order: t.sort_order ?? i,
  }))

  const { error: testsError } = await supabase
    .from('lab_results')
    .insert(testRows)

  if (testsError) return { success: false, error: testsError.message }

  revalidatePath('/lab')
  revalidatePath(`/lab/${id}`)
  return { success: true }
}

export async function updateLabStatus(id: string, status: LabTestStatus): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const updates: Record<string, unknown> = { status }

  if (status === 'collected') updates.collected_at = new Date().toISOString()
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
    updates.technician_id = auth.user?.id ?? null
  }

  const { error } = await supabase
    .from('lab_requests')
    .update(updates)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/lab')
  revalidatePath(`/lab/${id}`)
  return { success: true }
}

export async function deleteLabRequest(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('lab_requests').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/lab')
  return { success: true }
}
