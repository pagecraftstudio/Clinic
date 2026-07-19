import { notFound } from 'next/navigation'
import { getRadiologyOrderById } from '@/features/radiology/queries'
import { RadiologyOrderDetail } from '@/components/radiology/radiology-order-detail'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Radiology Order' }

export default async function RadiologyDetailPage({ params }: Props) {
  const { id } = await params
  try {
    const order = await getRadiologyOrderById(id)
    return (
      <div className="p-6">
        <RadiologyOrderDetail order={order} />
      </div>
    )
  } catch {
    notFound()
  }
}
