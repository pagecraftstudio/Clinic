import { notFound } from 'next/navigation'
import { getPrescriptionById } from '@/features/prescriptions/queries'
import { PrescriptionDetail } from '@/components/prescriptions/prescription-detail'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Prescription' }

export default async function PrescriptionDetailPage({ params }: Props) {
  const { id } = await params
  try {
    const prescription = await getPrescriptionById(id)
    return (
      <div className="p-6">
        <PrescriptionDetail prescription={prescription} />
      </div>
    )
  } catch {
    notFound()
  }
}
