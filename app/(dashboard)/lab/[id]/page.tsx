import { notFound } from 'next/navigation'
import { getLabRequestById } from '@/features/lab/queries'
import { LabRequestDetail } from '@/components/lab/lab-request-detail'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Lab Request' }

export default async function LabDetailPage({ params }: Props) {
  const { id } = await params
  try {
    const request = await getLabRequestById(id)
    return (
      <div className="p-6">
        <LabRequestDetail request={request} />
      </div>
    )
  } catch {
    notFound()
  }
}
