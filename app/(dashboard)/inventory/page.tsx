import { Suspense } from 'react'
import { getInventorySummary } from '@/features/inventory/queries'
import { InventoryClient } from './inventory-client'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'

export const metadata = { title: 'Inventory' }

export default async function InventoryPage() {
  const summary = await getInventorySummary()
  return (
    <Suspense fallback={<LoadingSkeleton rows={10} />}>
      <InventoryClient summary={summary} />
    </Suspense>
  )
}
