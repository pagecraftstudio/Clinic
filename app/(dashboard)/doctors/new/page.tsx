import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DoctorForm } from '@/components/doctors/doctor-form'

export const metadata = { title: 'Add Doctor' }

export default function NewDoctorPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <Link
        href="/doctors"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="size-3.5" /> Back to Doctors
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Add Doctor</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Fill in the profile, credentials, and schedule</p>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
        <DoctorForm />
      </div>
    </div>
  )
}
