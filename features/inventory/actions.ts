'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  inventoryItemSchema,
  stockAdjustmentSchema,
  supplierSchema,
  purchaseOrderSchema,
} from '@/lib/validations/inventory'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

// ── inventory items ───────────────────────────────────────────────────────────

export async function createInventoryItem(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = inventoryItemSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({ ...parsed.data, current_stock: 0, is_active: true })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/inventory')
  return { success: true, data: { id: data.id } }
}

export async function updateInventoryItem(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = inventoryItemSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('inventory_items')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/inventory')
  revalidatePath(`/inventory/${id}`)
  return { success: true }
}

export async function deleteInventoryItem(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('inventory_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/inventory')
  return { success: true }
}

export async function adjustStock(raw: unknown): Promise<ActionResult> {
  const parsed = stockAdjustmentSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('stock_movements')
    .insert({
      item_id: parsed.data.item_id,
      type: parsed.data.type,
      quantity: parsed.data.quantity,
      unit_cost: parsed.data.unit_cost ?? null,
      notes: parsed.data.notes ?? null,
      performed_by: auth.user?.id ?? null,
    })

  if (error) return { success: false, error: error.message }
  revalidatePath('/inventory')
  return { success: true }
}

// ── suppliers ────────────────────────────────────────────────────────────────

export async function createSupplier(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = supplierSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ ...parsed.data, is_active: true })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/inventory')
  return { success: true, data: { id: data.id } }
}

export async function updateSupplier(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = supplierSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('suppliers')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/inventory')
  return { success: true }
}

export async function deleteSupplier(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/inventory')
  return { success: true }
}

// ── purchase orders ──────────────────────────────────────────────────────────

export async function createPurchaseOrder(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = purchaseOrderSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { items, ...rest } = parsed.data
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0)

  const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
  const num = String((count ?? 0) + 1).padStart(6, '0')
  const po_number = `PO-${num}`

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert({
      ...rest,
      po_number,
      status: 'draft',
      subtotal,
      tax_amount: 0,
      total: subtotal,
      created_by: auth.user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  const itemRows = items.map((item) => ({
    po_id: po.id,
    item_id: item.item_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
    received_qty: 0,
  }))

  const { error: itemErr } = await supabase.from('purchase_order_items').insert(itemRows)
  if (itemErr) return { success: false, error: itemErr.message }

  revalidatePath('/inventory')
  return { success: true, data: { id: po.id } }
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled',
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'ordered') updates.ordered_at = new Date().toISOString()
  if (status === 'received') updates.received_at = new Date().toISOString()

  const { error } = await supabase.from('purchase_orders').update(updates).eq('id', id)
  if (error) return { success: false, error: error.message }

  if (status === 'received') {
    const { data: poItems } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('po_id', id)

    if (poItems && poItems.length > 0) {
      const movements = poItems.map((item) => ({
        item_id: item.item_id,
        type: 'in' as const,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        reference_id: id,
        reference_type: 'purchase_order',
        notes: `Received via PO`,
        performed_by: auth.user?.id ?? null,
      }))
      await supabase.from('stock_movements').insert(movements)

      // mark all items received
      for (const item of poItems) {
        await supabase
          .from('purchase_order_items')
          .update({ received_qty: item.quantity })
          .eq('id', item.id)
      }
    }
  }

  revalidatePath('/inventory')
  return { success: true }
}

export async function deletePurchaseOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('purchase_orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/inventory')
  return { success: true }
}
