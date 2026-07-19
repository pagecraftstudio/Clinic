import { getSuppliers, getInventoryItems } from '@/features/inventory/queries'
import { NewPurchaseOrderClient } from './new-purchase-order-client'

export const metadata = { title: 'New Purchase Order' }

export default async function NewPurchaseOrderPage() {
  const [suppliers, { data: items }] = await Promise.all([
    getSuppliers(),
    getInventoryItems({ pageSize: 200 }),
  ])
  return <NewPurchaseOrderClient suppliers={suppliers} items={items} />
}
