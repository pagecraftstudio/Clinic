export type InventoryCategory = 'medicine' | 'supply' | 'equipment' | 'consumable'
export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled'
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'return' | 'expired'

export interface Supplier {
  id: string
  name: string
  contact: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  name: string
  name_ar: string | null
  sku: string | null
  barcode: string | null
  category: InventoryCategory
  supplier_id: string | null
  unit: string
  unit_price: number | null
  selling_price: number | null
  current_stock: number
  minimum_stock: number
  maximum_stock: number | null
  reorder_point: number | null
  expiry_date: string | null
  storage_location: string | null
  notes: string | null
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  // joined
  suppliers?: { id: string; name: string } | null
}

export interface StockMovement {
  id: string
  item_id: string
  type: StockMovementType
  quantity: number
  unit_cost: number | null
  reference_id: string | null
  reference_type: string | null
  notes: string | null
  performed_by: string | null
  created_at: string
  // joined
  inventory_items?: { id: string; name: string; unit: string } | null
  profiles?: { display_name: string } | null
}

export interface PurchaseOrderItem {
  id: string
  po_id: string
  item_id: string
  quantity: number
  unit_cost: number
  received_qty: number
  total: number
  inventory_items?: { id: string; name: string; unit: string; sku: string | null } | null
}

export interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  status: PurchaseOrderStatus
  ordered_at: string | null
  expected_at: string | null
  received_at: string | null
  subtotal: number
  tax_amount: number
  total: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  suppliers?: { id: string; name: string } | null
  purchase_order_items?: PurchaseOrderItem[]
}

export interface InventoryFilters {
  search?: string
  category?: InventoryCategory | ''
  supplier_id?: string
  low_stock?: boolean
  expired?: boolean
  page?: number
  pageSize?: number
}

export interface InventorySummary {
  total_items: number
  low_stock_count: number
  out_of_stock_count: number
  expired_count: number
  total_value: number
}

export interface InventoryItemInput {
  name: string
  name_ar?: string | null
  sku?: string | null
  barcode?: string | null
  category: InventoryCategory
  supplier_id?: string | null
  unit: string
  unit_price?: number | null
  selling_price?: number | null
  minimum_stock: number
  maximum_stock?: number | null
  reorder_point?: number | null
  expiry_date?: string | null
  storage_location?: string | null
  notes?: string | null
}

export interface StockAdjustmentInput {
  item_id: string
  type: StockMovementType
  quantity: number
  unit_cost?: number | null
  notes?: string | null
}

export interface SupplierInput {
  name: string
  contact?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
}

export interface PurchaseOrderInput {
  supplier_id: string
  expected_at?: string | null
  notes?: string | null
  items: Array<{
    item_id: string
    quantity: number
    unit_cost: number
  }>
}
