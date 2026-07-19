'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit, Trash2, Package, AlertTriangle,
  TrendingUp, TrendingDown, RefreshCw,
} from 'lucide-react'
import { useDeleteInventoryItem } from '@/features/inventory/hooks'
import { StockStatusBadge } from '@/components/inventory/stock-status-badge'
import { StockAdjustmentDialog } from '@/components/inventory/stock-adjustment-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { InventoryItem, StockMovement } from '@/types/inventory'

const MOVEMENT_ICONS: Record<string, typeof TrendingUp> = {
  in: TrendingUp,
  return: TrendingUp,
  out: TrendingDown,
  expired: TrendingDown,
  adjustment: RefreshCw,
}

const MOVEMENT_COLORS: Record<string, string> = {
  in: 'var(--success)',
  return: 'var(--success)',
  out: 'var(--error)',
  expired: 'var(--error)',
  adjustment: 'var(--accent)',
}

interface Props {
  item: InventoryItem
  movements: StockMovement[]
}

export function InventoryItemDetailClient({ item, movements }: Props) {
  const router = useRouter()
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteItem = useDeleteInventoryItem()

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
          >
            <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{item.name}</h1>
              <StockStatusBadge item={item} />
            </div>
            {item.name_ar && (
              <p className="text-sm mt-0.5" dir="rtl" style={{ color: 'var(--text-muted)' }}>{item.name_ar}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAdjustOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}
          >
            <RefreshCw size={14} />
            Adjust Stock
          </button>
          <button
            onClick={() => router.push(`/inventory/${item.id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}
          >
            <Edit size={14} />
            Edit
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium"
            style={{ borderColor: 'var(--error)', color: 'var(--error)', background: 'var(--surface)' }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stock Card */}
        <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-center gap-2">
            <Package size={15} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Stock Levels</span>
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Current" value={`${item.current_stock} ${item.unit}`} bold accent />
            <Row label="Minimum" value={`${item.minimum_stock} ${item.unit}`} />
            {item.maximum_stock != null && <Row label="Maximum" value={`${item.maximum_stock} ${item.unit}`} />}
            {item.reorder_point != null && <Row label="Reorder At" value={`${item.reorder_point} ${item.unit}`} />}
          </div>
        </div>

        {/* Details Card */}
        <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Item Details</span>
          <div className="space-y-2 text-sm">
            <Row label="Category" value={item.category} capitalize />
            {item.sku && <Row label="SKU" value={item.sku} mono />}
            {item.barcode && <Row label="Barcode" value={item.barcode} mono />}
            {item.suppliers && <Row label="Supplier" value={item.suppliers.name} />}
            {item.storage_location && <Row label="Location" value={item.storage_location} />}
            {item.expiry_date && <Row label="Expiry" value={formatDate(item.expiry_date)} />}
          </div>
        </div>

        {/* Pricing Card */}
        <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Pricing</span>
          <div className="space-y-2 text-sm">
            {item.unit_price != null && <Row label="Unit Cost" value={formatCurrency(item.unit_price)} />}
            {item.selling_price != null && <Row label="Selling Price" value={formatCurrency(item.selling_price)} />}
            <Row label="Stock Value" value={formatCurrency((item.unit_price ?? 0) * item.current_stock)} bold />
          </div>
        </div>
      </div>

      {item.notes && (
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Notes</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.notes}</p>
        </div>
      )}

      {/* Stock Movements */}
      <div className="rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Stock History</h2>
        </div>
        {movements.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No stock movements yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {movements.map((m) => {
              const Icon = MOVEMENT_ICONS[m.type] ?? RefreshCw
              const color = MOVEMENT_COLORS[m.type] ?? 'var(--text-muted)'
              const sign = ['in', 'return'].includes(m.type) ? '+' : '-'
              return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="p-1.5 rounded-lg" style={{ background: `${color}15` }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                      {m.type.replace('_', ' ')}
                    </p>
                    {m.notes && (
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.notes}</p>
                    )}
                  </div>
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{ color }}
                  >
                    {sign}{m.quantity} {item.unit}
                  </span>
                  <span className="text-[11px] w-24 text-right" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(m.created_at, 'datetime')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <StockAdjustmentDialog item={item} open={adjustOpen} onClose={() => setAdjustOpen(false)} />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Item"
        description={`Delete "${item.name}" from inventory? This cannot be undone.`}
        onConfirm={async () => {
          await deleteItem.mutateAsync(item.id)
          router.push('/inventory')
        }}
        onCancel={() => setDeleteOpen(false)}
        isLoading={deleteItem.isPending}
      />
    </div>
  )
}

function Row({
  label,
  value,
  bold,
  accent,
  capitalize,
  mono,
}: {
  label: string
  value: string | number
  bold?: boolean
  accent?: boolean
  capitalize?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex justify-between">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span
        className={[
          bold ? 'font-semibold' : 'font-medium',
          capitalize ? 'capitalize' : '',
          mono ? 'font-mono text-xs' : '',
        ].join(' ')}
        style={{ color: accent ? 'var(--accent)' : 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}
