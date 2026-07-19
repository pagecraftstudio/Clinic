import { notFound } from 'next/navigation'
import { getPurchaseOrderById } from '@/features/inventory/queries'
import { PurchaseOrderDetailClient } from './purchase-order-detail-client'

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const order = await getPurchaseOrderById(id)
    return <PurchaseOrderDetailClient order={order} />
  } catch {
    notFound()
  }
}
