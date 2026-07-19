'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useUpdateInventoryItem } from '@/features/inventory/hooks'
import { InventoryItemForm } from '@/components/inventory/inventory-item-form'
import type { InventoryItem, Supplier } from '@/types/inventory'

export function EditInventoryItemClient({ item, suppliers }: { item: InventoryItem; suppliers: Supplier[] }) {
  const router = useRouter()
  const update = useUpdateInventoryItem(item.id)

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
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Edit Item</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.name}</p>
        </div>
      </div>

      <InventoryItemForm
        item={item}
        suppliers={suppliers}
        isLoading={update.isPending}
        onSubmit={async (data) => {
          const res = await update.mutateAsync(data)
          if (res.success) router.push(`/inventory/${item.id}`)
        }}
      />

      {update.data && !update.data.success && (
        <p className="text-sm text-red-500">{update.data.error}</p>
      )}
    </div>
  )
}
