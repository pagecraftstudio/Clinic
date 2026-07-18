'use client'

import Link from 'next/link'
import { Phone, Calendar } from 'lucide-react'
import { formatAge, formatDate, getInitials } from '@/lib/utils'
import { PatientStatusBadge, BloodGroupBadge } from '@/components/shared/status-badge'
import type { Patient } from '@/types/patient'

export function PatientCard({ patient }: { patient: Patient }) {
  return (
    <Link
      href={`/patients/${patient.id}`}
      className="rounded-xl p-4 flex flex-col gap-3 transition-shadow hover:shadow-[var(--shadow-md)]"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            {getInitials(patient.full_name)}
          </div>
          <div>
            <p className="text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {patient.full_name}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {patient.patient_number} · {formatAge(patient.date_of_birth)} yrs
            </p>
          </div>
        </div>
        <PatientStatusBadge isActive={patient.is_active} />
      </div>

      <div className="flex items-center justify-between text-[12px]" style={{ color: 'var(--text-secondary)' }}>
        <span className="inline-flex items-center gap-1.5">
          <Phone size={12} style={{ color: 'var(--text-muted)' }} />
          {patient.phone}
        </span>
        <BloodGroupBadge group={patient.blood_group} />
      </div>

      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <Calendar size={12} />
        Registered {formatDate(patient.created_at, 'short')}
      </div>
    </Link>
  )
}

export function PatientSearchResultRow({
  patient, onSelect,
}: { patient: Pick<Patient, 'id' | 'full_name' | 'patient_number' | 'phone' | 'date_of_birth' | 'gender'>; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-[var(--bg-subtle)] transition-colors"
    >
      <div>
        <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{patient.full_name}</p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {patient.patient_number} · {patient.phone}
        </p>
      </div>
      {patient.date_of_birth && (
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatAge(patient.date_of_birth)} yrs</span>
      )}
    </button>
  )
}
