'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useCreateInventoryItem } from '@/features/inventory/hooks'
import { InventoryItemForm } from '@/components/inventory/inventory-item-form'
import type { Supplier } from '@/types/inventory'

export function NewInventoryItemClient({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter()
  const create = useCreateInventoryItem()

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
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Add Inventory Item</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Medicine, supply, or equipment</p>
        </div>
      </div>

      <InventoryItemForm
        suppliers={suppliers}
        isLoading={create.isPending}
        onSubmit={async (data) => {
          const res = await create.mutateAsync(data)
          if (res.success && res.data) router.push(`/inventory/${res.data.id}`)
        }}
      />

      {create.data && !create.data.success && (
        <p className="text-sm text-red-500">{create.data.error}</p>
      )}
    </div>
  )
}
