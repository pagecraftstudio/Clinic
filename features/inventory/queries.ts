import { createClient } from '@/lib/supabase/server'
import type {
  InventoryItem, InventoryFilters, InventorySummary,
  Supplier, PurchaseOrder, StockMovement,
} from '@/types/inventory'

const ITEM_SELECT = `*, suppliers ( id, name )`
const PO_SELECT = `*, suppliers ( id, name ), purchase_order_items ( *, inventory_items ( id, name, unit, sku ) )`

export async function getInventoryItems(filters: InventoryFilters = {}) {
  const supabase = await createClient()
  const { search, category, supplier_id, low_stock, expired, page = 1, pageSize = 50 } = filters

  let query = supabase
    .from('inventory_items')
    .select(ITEM_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (search) query = query.ilike('name', `%${search}%`)
  if (category) query = query.eq('category', category)
  if (supplier_id) query = query.eq('supplier_id', supplier_id)
  if (low_stock) query = query.lt('current_stock', supabase.rpc as unknown as number)
  if (expired) {
    const today = new Date().toISOString().split('T')[0]
    query = query.lte('expiry_date', today).not('expiry_date', 'is', null)
  }

  const from = (page - 1) * pageSize
  const { data, error, count } = await query.range(from, from + pageSize - 1)
  if (error) throw error
  return { data: (data ?? []) as InventoryItem[], count: count ?? 0 }
}

export async function getInventoryItemById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_items')
    .select(ITEM_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error
  return data as InventoryItem
}

export async function getInventorySummary(): Promise<InventorySummary> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_items')
    .select('current_stock, minimum_stock, unit_price, expiry_date')
    .is('deleted_at', null)
    .eq('is_active', true)
  if (error) throw error

  const today = new Date().toISOString().split('T')[0]
  let total_value = 0
  let low_stock_count = 0
  let out_of_stock_count = 0
  let expired_count = 0

  for (const item of data ?? []) {
    total_value += (item.current_stock ?? 0) * (item.unit_price ?? 0)
    if ((item.current_stock ?? 0) === 0) out_of_stock_count++
    else if ((item.current_stock ?? 0) <= (item.minimum_stock ?? 0)) low_stock_count++
    if (item.expiry_date && item.expiry_date <= today) expired_count++
  }

  return {
    total_items: data?.length ?? 0,
    low_stock_count,
    out_of_stock_count,
    expired_count,
    total_value,
  }
}

export async function getSuppliers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Supplier[]
}

export async function getPurchaseOrders(filters: { status?: string; page?: number; pageSize?: number } = {}) {
  const supabase = await createClient()
  const { status, page = 1, pageSize = 50 } = filters

  let query = supabase
    .from('purchase_orders')
    .select(PO_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const from = (page - 1) * pageSize
  const { data, error, count } = await query.range(from, from + pageSize - 1)
  if (error) throw error
  return { data: (data ?? []) as PurchaseOrder[], count: count ?? 0 }
}

export async function getPurchaseOrderById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(PO_SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as PurchaseOrder
}

export async function getStockMovements(item_id?: string, limit = 50) {
  const supabase = await createClient()
  let query = supabase
    .from('stock_movements')
    .select('*, inventory_items ( id, name, unit ), profiles ( display_name )')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (item_id) query = query.eq('item_id', item_id)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as StockMovement[]
}
