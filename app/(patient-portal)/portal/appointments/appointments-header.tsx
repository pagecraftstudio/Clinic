'use client'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useLang } from '@/lib/i18n/context'

export function AppointmentsHeader({ patient }: { patient: any }) {
  const { tr } = useLang()
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{tr.myAppointments}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {patient.full_name} · #{patient.patient_number}
        </p>
      </div>
      <Link href="/portal/appointments/new"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
        style={{ background: 'var(--accent)', color: 'white' }}>
        <Plus size={14} />
        {tr.bookNew}
      </Link>
    </div>
  )
}
