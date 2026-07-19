import { notFound } from 'next/navigation'
import { getInventoryItemById, getStockMovements } from '@/features/inventory/queries'
import { InventoryItemDetailClient } from './inventory-item-detail-client'

export default async function InventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const [item, movements] = await Promise.all([
      getInventoryItemById(id),
      getStockMovements(id, 30),
    ])
    return <InventoryItemDetailClient item={item} movements={movements} />
  } catch {
    notFound()
  }
}
