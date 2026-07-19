import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getDoctorById } from '@/features/doctors/queries'
import { DoctorForm } from '@/components/doctors/doctor-form'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Edit Doctor' }

export default async function EditDoctorPage({ params }: Props) {
  const { id } = await params
  try {
    const doctor = await getDoctorById(id)
    const name = doctor.profiles?.display_name ?? `${doctor.profiles?.first_name} ${doctor.profiles?.last_name}`

    return (
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <Link
          href={`/doctors/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to {name}
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Edit Doctor</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{name}</p>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
          <DoctorForm doctor={doctor} />
        </div>
      </div>
    )
  } catch {
    notFound()
  }
}
