'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package, Plus, Search, AlertTriangle, TrendingDown,
  Calendar, DollarSign, Truck, BarChart2, RefreshCw, Settings2,
} from 'lucide-react'
import {
  useInventoryItems, useDeleteInventoryItem,
  useSuppliers, usePurchaseOrders, useUpdatePurchaseOrderStatus,
  useDeletePurchaseOrder,
} from '@/features/inventory/hooks'
import { DataTable, type Column } from '@/components/shared/data-table'
import { StockStatusBadge } from '@/components/inventory/stock-status-badge'
import { StockAdjustmentDialog } from '@/components/inventory/stock-adjustment-dialog'
import { SupplierDialog } from '@/components/inventory/supplier-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { InventoryItem, InventoryFilters, InventoryCategory, InventorySummary, Supplier, PurchaseOrder } from '@/types/inventory'

interface InventoryClientProps {
  summary: InventorySummary
}

const CATEGORIES: { value: InventoryCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'supply', label: 'Supply' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'consumable', label: 'Consumable' },
]

const PO_STATUS_COLORS: Record<string, string> = {
  draft: 'var(--text-muted)',
  ordered: 'var(--accent)',
  partial: 'var(--warning)',
  received: 'var(--success)',
  cancelled: 'var(--error)',
}

type Tab = 'items' | 'orders' | 'suppliers'

export function InventoryClient({ summary }: InventoryClientProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('items')
  const [filters, setFilters] = useState<InventoryFilters>({ page: 1, pageSize: 50 })
  const [search, setSearch] = useState('')
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null)
  const [editSupplier, setEditSupplier] = useState<Supplier | null | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string; type: 'item' | 'po' } | null>(null)

  const { data: itemData, isLoading: itemsLoading } = useInventoryItems(filters)
  const { data: poData, isLoading: poLoading } = usePurchaseOrders({ page: 1, pageSize: 50 })
  const { data: suppliers = [] } = useSuppliers()
  const deleteItem = useDeleteInventoryItem()
  const updatePoStatus = useUpdatePurchaseOrderStatus()
  const deletePo = useDeletePurchaseOrder()

  const items = itemData?.data ?? []
  const itemTotal = itemData?.count ?? 0
  const orders = poData?.data ?? []

  function applySearch() {
    setFilters((f) => ({ ...f, search, page: 1 }))
  }

  // ── stats ────────────────────────────────────────────────────────────────────
  const stats = [
    {
      label: 'Total Items',
      value: summary.total_items,
      icon: Package,
      color: 'var(--accent)',
    },
    {
      label: 'Low Stock',
      value: summary.low_stock_count,
      icon: TrendingDown,
      color: 'var(--warning)',
      alert: summary.low_stock_count > 0,
    },
    {
      label: 'Out of Stock',
      value: summary.out_of_stock_count,
      icon: AlertTriangle,
      color: 'var(--error)',
      alert: summary.out_of_stock_count > 0,
    },
    {
      label: 'Inventory Value',
      value: formatCurrency(summary.total_value),
      icon: DollarSign,
      color: 'var(--success)',
      wide: true,
    },
  ]

  // ── item columns ─────────────────────────────────────────────────────────────
  const itemColumns: Column<InventoryItem>[] = [
    {
      key: 'name',
      header: 'Item',
      render: (row) => (
        <div>
          <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{row.name}</p>
          {row.sku && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>SKU: {row.sku}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="capitalize text-[12px]" style={{ color: 'var(--text-secondary)' }}>{row.category}</span>
      ),
    },
    {
      key: 'current_stock',
      header: 'Stock',
      render: (row) => (
        <div>
          <p className="text-[13px] font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {row.current_stock} {row.unit}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Min: {row.minimum_stock}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StockStatusBadge item={row} />,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row) => (
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          {row.suppliers?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'unit_price',
      header: 'Unit Cost',
      render: (row) => (
        <span className="text-[12px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {row.unit_price != null ? formatCurrency(row.unit_price) : '—'}
        </span>
      ),
    },
    {
      key: 'expiry_date',
      header: 'Expiry',
      render: (row) => (
        <span className="text-[12px]" style={{ color: row.expiry_date && row.expiry_date <= new Date().toISOString().split('T')[0] ? 'var(--error)' : 'var(--text-secondary)' }}>
          {row.expiry_date ? formatDate(row.expiry_date) : '—'}
        </span>
      ),
    },
  ]

  // ── PO columns ───────────────────────────────────────────────────────────────
  const poColumns: Column<PurchaseOrder>[] = [
    {
      key: 'po_number',
      header: 'PO Number',
      render: (row) => (
        <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
          {row.po_number}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row) => (
        <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
          {row.suppliers?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize"
          style={{ color: PO_STATUS_COLORS[row.status], background: `${PO_STATUS_COLORS[row.status]}20` }}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'items_count',
      header: 'Items',
      render: (row) => (
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          {row.purchase_order_items?.length ?? 0} item(s)
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => (
        <span className="text-[12px] font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {formatCurrency(row.total)}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (row) => (
        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {formatDate(row.created_at)}
        </span>
      ),
    },
  ]

  // ── supplier columns ─────────────────────────────────────────────────────────
  const supplierColumns: Column<Supplier>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{row.name}</span>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{row.contact ?? '—'}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => (
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{row.phone ?? '—'}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => (
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{row.email ?? '—'}</span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Inventory
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Medicines, supplies, equipment, and purchase orders
          </p>
        </div>
        <div className="flex gap-2">
          {tab === 'items' && (
            <>
              <button
                onClick={() => router.push('/inventory/new')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                <Plus size={15} />
                Add Item
              </button>
            </>
          )}
          {tab === 'orders' && (
            <button
              onClick={() => router.push('/inventory/orders/new')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Plus size={15} />
              New PO
            </button>
          )}
          {tab === 'suppliers' && (
            <button
              onClick={() => setEditSupplier(null)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Plus size={15} />
              New Supplier
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border p-4"
            style={{
              borderColor: s.alert ? s.color : 'var(--border)',
              background: s.alert ? `${s.color}08` : 'var(--surface)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={14} style={{ color: s.color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
            <p className="text-xl font-semibold tabular-nums" style={{ color: s.alert ? s.color : 'var(--text-primary)' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--surface-hover)' }}>
        {([
          { key: 'items', label: 'Items', icon: Package },
          { key: 'orders', label: 'Purchase Orders', icon: Truck },
          { key: 'suppliers', label: 'Suppliers', icon: BarChart2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{
              background: tab === key ? 'var(--surface)' : 'transparent',
              color: tab === key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Items Tab */}
      {tab === 'items' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                placeholder="Search items..."
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={applySearch}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <Search size={14} />
              </button>
            </div>
            <select
              value={filters.category ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value as InventoryCategory | '', page: 1 }))}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={!!filters.low_stock}
                onChange={(e) => setFilters((f) => ({ ...f, low_stock: e.target.checked || undefined, page: 1 }))}
              />
              Low Stock Only
            </label>
          </div>

          {itemsLoading ? (
            <LoadingSkeleton rows={8} />
          ) : (
            <DataTable
              data={items}
              columns={itemColumns}
              onRowClick={(row) => router.push(`/inventory/${row.id}`)}
              rowActions={(row) => [
                {
                  label: 'Adjust Stock',
                  onClick: () => setAdjustItem(row),
                },
                {
                  label: 'Edit',
                  onClick: () => router.push(`/inventory/${row.id}/edit`),
                },
                {
                  label: 'Delete',
                  onClick: () => setDeleteTarget({ id: row.id, label: row.name, type: 'item' }),
                  variant: 'destructive',
                },
              ]}
              emptyMessage="No inventory items found"
            />
          )}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {poLoading ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <DataTable
              data={orders}
              columns={poColumns}
              onRowClick={(row) => router.push(`/inventory/orders/${row.id}`)}
              rowActions={(row) => [
                ...(row.status === 'draft' ? [{
                  label: 'Mark as Ordered',
                  onClick: () => updatePoStatus.mutate({ id: row.id, status: 'ordered' }),
                }] : []),
                ...(row.status === 'ordered' ? [{
                  label: 'Mark as Received',
                  onClick: () => updatePoStatus.mutate({ id: row.id, status: 'received' }),
                }] : []),
                ...(row.status !== 'received' && row.status !== 'cancelled' ? [{
                  label: 'Cancel',
                  onClick: () => setDeleteTarget({ id: row.id, label: row.po_number, type: 'po' }),
                  variant: 'destructive' as const,
                }] : []),
              ]}
              emptyMessage="No purchase orders"
            />
          )}
        </div>
      )}

      {/* Suppliers Tab */}
      {tab === 'suppliers' && (
        <DataTable
          data={suppliers}
          columns={supplierColumns}
          rowActions={(row) => [
            {
              label: 'Edit',
              onClick: () => setEditSupplier(row),
            },
          ]}
          emptyMessage="No suppliers yet"
        />
      )}

      {/* Dialogs */}
      <StockAdjustmentDialog
        item={adjustItem}
        open={!!adjustItem}
        onClose={() => setAdjustItem(null)}
      />

      <SupplierDialog
        supplier={editSupplier}
        open={editSupplier !== undefined}
        onClose={() => setEditSupplier(undefined)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === 'po' ? 'Purchase Order' : 'Item'}`}
        description={`Are you sure you want to delete "${deleteTarget?.label}"? This cannot be undone.`}
        onConfirm={async () => {
          if (!deleteTarget) return
          if (deleteTarget.type === 'item') await deleteItem.mutateAsync(deleteTarget.id)
          else await deletePo.mutateAsync(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteItem.isPending || deletePo.isPending}
      />
    </div>
  )
}
