'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Package, Truck } from 'lucide-react'
import { useUpdatePurchaseOrderStatus } from '@/features/inventory/hooks'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { PurchaseOrder } from '@/types/inventory'

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--text-muted)',
  ordered: 'var(--accent)',
  partial: 'var(--warning)',
  received: 'var(--success)',
  cancelled: 'var(--error)',
}

export function PurchaseOrderDetailClient({ order }: { order: PurchaseOrder }) {
  const router = useRouter()
  const updateStatus = useUpdatePurchaseOrderStatus()

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
            <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold font-mono" style={{ color: 'var(--accent)' }}>{order.po_number}</h1>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                style={{ color: STATUS_COLORS[order.status], background: `${STATUS_COLORS[order.status]}20` }}
              >
                {order.status}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {order.suppliers?.name} · {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status === 'draft' && (
            <button
              onClick={() => updateStatus.mutate({ id: order.id, status: 'ordered' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--accent)', color: '#fff' }}
              disabled={updateStatus.isPending}
            >
              <Truck size={14} />
              Mark Ordered
            </button>
          )}
          {order.status === 'ordered' && (
            <button
              onClick={() => updateStatus.mutate({ id: order.id, status: 'received' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--success)', color: '#fff' }}
              disabled={updateStatus.isPending}
            >
              <CheckCircle size={14} />
              Mark Received
            </button>
          )}
        </div>
      </div>

      {/* Items table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Order Items</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {(order.purchase_order_items ?? []).map((poi) => (
            <div key={poi.id} className="flex items-center gap-4 px-5 py-3" style={{ background: 'var(--surface)' }}>
              <Package size={14} style={{ color: 'var(--text-muted)' }} />
              <div className="flex-1">
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {poi.inventory_items?.name ?? '—'}
                </p>
                {poi.inventory_items?.sku && (
                  <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {poi.inventory_items.sku}
                  </p>
                )}
              </div>
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {poi.quantity} {poi.inventory_items?.unit ?? 'pcs'} × {formatCurrency(poi.unit_cost)}
              </span>
              <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(poi.total)}
              </span>
            </div>
          ))}
        </div>
        <div
          className="flex justify-between items-center px-5 py-4 border-t"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-hover)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total</span>
          <span className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>

      {order.notes && (
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Notes</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{order.notes}</p>
        </div>
      )}
    </div>
  )
}
