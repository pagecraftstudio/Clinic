import { getSuppliers } from '@/features/inventory/queries'
import { NewInventoryItemClient } from './new-inventory-item-client'

export const metadata = { title: 'New Inventory Item' }

export default async function NewInventoryItemPage() {
  const suppliers = await getSuppliers()
  return <NewInventoryItemClient suppliers={suppliers} />
}
