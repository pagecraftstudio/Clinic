'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Phone, Mail, MapPin, Shield, AlertTriangle, FileText, Upload,
  Pencil, UserX, UserCheck, Stethoscope, Pill, Receipt, FlaskConical, Scan,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientStatusBadge, BloodGroupBadge, GenderBadge } from '@/components/shared/status-badge'
import { PatientTimeline } from '@/components/patients/patient-timeline'
import { PatientForm } from '@/components/patients/patient-form'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { useDeactivatePatient, useReactivatePatient, useUpdatePatient } from '@/features/patients/hooks'
import { formatAge, formatDate, getInitials } from '@/lib/utils'
import type { Patient, EmergencyContact, PatientDocument, PatientTimelineEvent } from '@/types/patient'

interface Props {
  patient: Patient
  contacts: EmergencyContact[]
  documents: PatientDocument[]
  timeline: PatientTimelineEvent[]
}

const QUICK_LINKS = [
  { label: 'EMR', icon: Stethoscope, suffix: 'emr' },
  { label: 'Prescriptions', icon: Pill, suffix: 'prescriptions' },
  { label: 'Billing', icon: Receipt, suffix: 'billing' },
  { label: 'Lab', icon: FlaskConical, suffix: 'lab' },
  { label: 'Radiology', icon: Scan, suffix: 'radiology' },
]

export function PatientDetailClient({ patient, contacts, documents, timeline }: Props) {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const deactivate = useDeactivatePatient()
  const reactivate = useReactivatePatient()
  const update = useUpdatePatient(patient.id)

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-bold flex-shrink-0"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            {getInitials(patient.full_name)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>{patient.full_name}</h1>
              <PatientStatusBadge isActive={patient.is_active} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <span>{patient.patient_number}</span>
              {patient.date_of_birth && <span>{formatAge(patient.date_of_birth)} yrs</span>}
              <GenderBadge gender={patient.gender} />
              <BloodGroupBadge group={patient.blood_group} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {patient.is_active ? (
            <Button variant="outline" size="sm" onClick={() => setConfirmDeactivate(true)}>
              <UserX size={13} className="mr-1.5" /> Deactivate
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => reactivate.mutate(patient.id)} disabled={reactivate.isPending}>
              <UserCheck size={13} className="mr-1.5" /> Reactivate
            </Button>
          )}
        </div>
      </div>

      {/* Quick links to other modules */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {QUICK_LINKS.map(({ label, icon: Icon, suffix }) => (
          <Link
            key={suffix}
            href={`/patients/${patient.id}/${suffix}`}
            className="rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:shadow-[var(--shadow-md)] transition-shadow"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <Icon size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
          </Link>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="edit"><Pencil size={12} className="mr-1" /> Edit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-5 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Contact</h3>
              <InfoRow icon={Phone} label={patient.phone} />
              {patient.email && <InfoRow icon={Mail} label={patient.email} />}
              {(patient.address || patient.city) && (
                <InfoRow icon={MapPin} label={[patient.address, patient.city, patient.governorate].filter(Boolean).join(', ')} />
              )}
            </div>

            <div className="rounded-xl p-5 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Medical</h3>
              {patient.allergies && patient.allergies.length > 0 && (
                <TagRow icon={AlertTriangle} label="Allergies" values={patient.allergies} tone="danger" />
              )}
              {patient.chronic_diseases && patient.chronic_diseases.length > 0 && (
                <TagRow icon={Stethoscope} label="Chronic" values={patient.chronic_diseases} tone="warning" />
              )}
              {patient.current_medications && patient.current_medications.length > 0 && (
                <TagRow icon={Pill} label="Medications" values={patient.current_medications} tone="info" />
              )}
              {!patient.allergies?.length && !patient.chronic_diseases?.length && !patient.current_medications?.length && (
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>No medical flags on record.</p>
              )}
            </div>

            {patient.insurance_company && (
              <div className="rounded-xl p-5 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Insurance</h3>
                <InfoRow icon={Shield} label={`${patient.insurance_company} · ${patient.insurance_number ?? '—'}`} />
                {patient.insurance_expiry && (
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Expires {formatDate(patient.insurance_expiry, 'short')}</p>
                )}
              </div>
            )}

            <div className="rounded-xl p-5 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Emergency contacts</h3>
              {contacts.length === 0 && <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>None added.</p>}
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-[12px]">
                  <span style={{ color: 'var(--text-primary)' }}>{c.name} <span style={{ color: 'var(--text-muted)' }}>({c.relation})</span></span>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.phone}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="pt-4">
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <PatientTimeline events={timeline} />
          </div>
        </TabsContent>

        <TabsContent value="documents" className="pt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline"><Upload size={13} className="mr-1.5" /> Upload document</Button>
          </div>
          {documents.length === 0 ? (
            <EmptyState icon={FileText} title="No documents" description="Uploaded IDs, insurance cards, and reports will appear here." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl p-4 flex items-center gap-3 hover:shadow-[var(--shadow-md)] transition-shadow"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <FileText size={16} style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="text-[12.5px] font-medium" style={{ color: 'var(--text-primary)' }}>{doc.name}</p>
                    <p className="text-[11px] capitalize" style={{ color: 'var(--text-muted)' }}>{doc.type.replace(/_/g, ' ')}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="edit" className="pt-4">
          <PatientForm patient={patient} onSubmit={(values) => update.mutateAsync(values)} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Deactivate patient?"
        description="The record is kept for history but hidden from active lists. This can be reversed."
        confirmLabel="Deactivate"
        destructive
        loading={deactivate.isPending}
        onConfirm={() => deactivate.mutate(patient.id, { onSuccess: () => setConfirmDeactivate(false) })}
      />
    </div>
  )
}

function InfoRow({ icon: Icon, label }: { icon: typeof Phone; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
      <Icon size={13} style={{ color: 'var(--text-muted)' }} />
      {label}
    </div>
  )
}

function TagRow({
  icon: Icon, label, values, tone,
}: { icon: typeof Phone; label: string; values: string[]; tone: 'danger' | 'warning' | 'info' }) {
  const colorMap = { danger: 'var(--danger)', warning: 'var(--warning)', info: 'var(--info)' }
  const bgMap = { danger: 'var(--danger-light)', warning: 'var(--warning-light)', info: 'var(--info-light)' }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
        <Icon size={12} /> {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: bgMap[tone], color: colorMap[tone] }}>
            {v}
          </span>
        ))}
      </div>
    </div>
  )
}
