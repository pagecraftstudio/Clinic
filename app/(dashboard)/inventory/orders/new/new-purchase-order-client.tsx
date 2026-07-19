'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useCreatePurchaseOrder } from '@/features/inventory/hooks'
import { PurchaseOrderForm } from '@/components/inventory/purchase-order-form'
import type { Supplier, InventoryItem } from '@/types/inventory'

export function NewPurchaseOrderClient({ suppliers, items }: { suppliers: Supplier[]; items: InventoryItem[] }) {
  const router = useRouter()
  const create = useCreatePurchaseOrder()

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
        >
          <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>New Purchase Order</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Order supplies from a supplier</p>
        </div>
      </div>

      <PurchaseOrderForm
        suppliers={suppliers}
        items={items}
        isLoading={create.isPending}
        onSubmit={async (data) => {
          const res = await create.mutateAsync(data)
          if (res.success) router.push('/inventory?tab=orders')
        }}
      />

      {create.data && !create.data.success && (
        <p className="text-sm text-red-500">{create.data.error}</p>
      )}
    </div>
  )
}
