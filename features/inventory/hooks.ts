'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { InventoryFilters, InventoryItem, Supplier, PurchaseOrder, StockMovement } from '@/types/inventory'
import {
  createInventoryItem, updateInventoryItem, deleteInventoryItem,
  adjustStock, createSupplier, updateSupplier, deleteSupplier,
  createPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder,
} from './actions'

const ITEM_SELECT = `*, suppliers ( id, name )`
const PO_SELECT = `*, suppliers ( id, name ), purchase_order_items ( *, inventory_items ( id, name, unit, sku ) )`

export function useInventoryItems(filters: InventoryFilters) {
  return useQuery({
    queryKey: ['inventory_items', filters],
    queryFn: async () => {
      const supabase = createClient()
      const { search, category, supplier_id, page = 1, pageSize = 50 } = filters

      let query = supabase
        .from('inventory_items')
        .select(ITEM_SELECT, { count: 'exact' })
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (search) query = query.ilike('name', `%${search}%`)
      if (category) query = query.eq('category', category)
      if (supplier_id) query = query.eq('supplier_id', supplier_id)
      if (filters.low_stock) query = query.filter('current_stock', 'lte', 'minimum_stock')
      if (filters.expired) {
        const today = new Date().toISOString().split('T')[0]
        query = query.lte('expiry_date', today).not('expiry_date', 'is', null)
      }

      const from = (page - 1) * pageSize
      const { data, error, count } = await query.range(from, from + pageSize - 1)
      if (error) throw error
      return { data: (data ?? []) as InventoryItem[], count: count ?? 0 }
    },
  })
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ['inventory_item', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('inventory_items')
        .select(ITEM_SELECT)
        .eq('id', id)
        .is('deleted_at', null)
        .single()
      if (error) throw error
      return data as InventoryItem
    },
    enabled: !!id,
  })
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as Supplier[]
    },
  })
}

export function usePurchaseOrders(filters: { status?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['purchase_orders', filters],
    queryFn: async () => {
      const supabase = createClient()
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
    },
  })
}

export function useStockMovements(item_id?: string) {
  return useQuery({
    queryKey: ['stock_movements', item_id],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from('stock_movements')
        .select('*, inventory_items ( id, name, unit ), profiles ( display_name )')
        .order('created_at', { ascending: false })
        .limit(100)
      if (item_id) query = query.eq('item_id', item_id)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as StockMovement[]
    },
  })
}

export function useCreateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory_items'] }),
  })
}

export function useUpdateInventoryItem(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => updateInventoryItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_items'] })
      qc.invalidateQueries({ queryKey: ['inventory_item', id] })
    },
  })
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory_items'] }),
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_items'] })
      qc.invalidateQueries({ queryKey: ['stock_movements'] })
    },
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useUpdateSupplier(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => updateSupplier(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase_orders'] }),
  })
}

export function useUpdatePurchaseOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Parameters<typeof updatePurchaseOrderStatus>[1] }) =>
      updatePurchaseOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase_orders'] }),
  })
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase_orders'] }),
  })
}
