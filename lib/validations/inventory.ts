import { z } from 'zod'

export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  name_ar: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  category: z.enum(['medicine', 'supply', 'equipment', 'consumable']),
  supplier_id: z.string().uuid().nullable().optional(),
  unit: z.string().min(1, 'Unit is required'),
  unit_price: z.number().min(0).nullable().optional(),
  selling_price: z.number().min(0).nullable().optional(),
  minimum_stock: z.number().min(0).default(0),
  maximum_stock: z.number().min(0).nullable().optional(),
  reorder_point: z.number().min(0).nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  storage_location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const stockAdjustmentSchema = z.object({
  item_id: z.string().uuid(),
  type: z.enum(['in', 'out', 'adjustment', 'return', 'expired']),
  quantity: z.number().positive('Quantity must be positive'),
  unit_cost: z.number().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')).transform(v => v || null),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().uuid('Supplier is required'),
  expected_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(z.object({
    item_id: z.string().uuid(),
    quantity: z.number().positive(),
    unit_cost: z.number().min(0),
  })).min(1, 'At least one item required'),
})

export type InventoryItemSchema = z.infer<typeof inventoryItemSchema>
export type StockAdjustmentSchema = z.infer<typeof stockAdjustmentSchema>
export type SupplierSchema = z.infer<typeof supplierSchema>
export type PurchaseOrderSchema = z.infer<typeof purchaseOrderSchema>
