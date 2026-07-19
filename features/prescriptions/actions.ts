'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prescriptionSchema } from '@/lib/validations/prescription'
import type { PrescriptionInput } from '@/types/prescription'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export async function createPrescription(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = prescriptionSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const { items, ...rest } = parsed.data

  const { data: prescription, error } = await supabase
    .from('prescriptions')
    .insert({
      ...rest,
      prescription_number: 'RX-TMP', // trigger overwrites
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  const itemRows = items.map((item, i) => ({
    ...item,
    prescription_id: prescription.id,
    sort_order: item.sort_order ?? i,
  }))

  const { error: itemsError } = await supabase
    .from('prescription_items')
    .insert(itemRows)

  if (itemsError) {
    await supabase.from('prescriptions').delete().eq('id', prescription.id)
    return { success: false, error: itemsError.message }
  }

  revalidatePath('/prescriptions')
  return { success: true, data: { id: prescription.id } }
}

export async function updatePrescription(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = prescriptionSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { items, ...rest } = parsed.data

  const { error } = await supabase
    .from('prescriptions')
    .update(rest)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  // replace items
  await supabase.from('prescription_items').delete().eq('prescription_id', id)

  const itemRows = items.map((item, i) => ({
    ...item,
    prescription_id: id,
    sort_order: item.sort_order ?? i,
  }))

  const { error: itemsError } = await supabase
    .from('prescription_items')
    .insert(itemRows)

  if (itemsError) return { success: false, error: itemsError.message }

  revalidatePath('/prescriptions')
  revalidatePath(`/prescriptions/${id}`)
  return { success: true }
}

export async function markDispensed(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('prescriptions')
    .update({
      is_dispensed: true,
      dispensed_at: new Date().toISOString(),
      dispensed_by: auth.user?.id ?? null,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/prescriptions')
  revalidatePath(`/prescriptions/${id}`)
  return { success: true }
}

export async function deletePrescription(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('prescriptions').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/prescriptions')
  return { success: true }
}
