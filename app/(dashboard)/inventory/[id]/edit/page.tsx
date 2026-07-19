import { notFound } from 'next/navigation'
import { getInventoryItemById, getSuppliers } from '@/features/inventory/queries'
import { EditInventoryItemClient } from './edit-inventory-item-client'

export const metadata = { title: 'Edit Inventory Item' }

export default async function EditInventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const [item, suppliers] = await Promise.all([getInventoryItemById(id), getSuppliers()])
    return <EditInventoryItemClient item={item} suppliers={suppliers} />
  } catch {
    notFound()
  }
}
