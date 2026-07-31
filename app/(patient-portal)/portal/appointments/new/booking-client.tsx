'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { bookAppointment } from '@/features/patient-portal/actions'
import { CheckCircle, Loader2, ChevronRight, Calendar, Clock, FileText } from 'lucide-react'
import { useLang } from '@/lib/i18n/context'

interface DoctorProfile { display_name: string; avatar_url: string | null }
interface Doctor { id: string; specialty: string; consultation_fee: number | null; profiles: DoctorProfile | null }

function getMinDate() {
  const d = new Date()
  d.setMinutes(d.getMinutes() + 30)
  return d.toISOString().slice(0, 16)
}

const inputCls: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg-surface)',
  color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}
const labelCls: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)',
}

export function BookingClient({ doctors }: { doctors: Doctor[] }) {
  const { tr, isRtl, lang } = useLang()
  const [step, setStep] = useState<'doctor' | 'details' | 'done'>('doctor')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [type, setType] = useState('in_person')
  const [complaint, setComplaint] = useState('')
  const [confirmation, setConfirmation] = useState<{ id: string; appointment_number: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB'

  const TYPE_OPTIONS = [
    { value: 'in_person', label: tr.inPerson },
    { value: 'online', label: tr.online },
    { value: 'home_visit', label: tr.homeVisit },
  ]

  const bySpecialty = doctors.reduce<Record<string, Doctor[]>>((acc, d) => {
    const s = d.specialty || 'General'
    ;(acc[s] = acc[s] ?? []).push(d)
    return acc
  }, {})

  function handleBook() {
    if (!selectedDoctor || !scheduledAt) return
    setError(null)
    startTransition(async () => {
      const result = await bookAppointment({ doctor_id: selectedDoctor.id, scheduled_at: scheduledAt, type, chief_complaint: complaint || undefined })
      if (result.success && result.data) { setConfirmation(result.data); setStep('done') }
      else setError(result.error ?? tr.registrationFailed)
    })
  }

  if (step === 'done' && confirmation) {
    return (
      <div className="rounded-2xl p-8 text-center" dir={isRtl ? 'rtl' : 'ltr'}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--accent-light)' }}>
          <CheckCircle size={28} style={{ color: 'var(--accent)' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{tr.bookingSuccess}</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
          {tr.with} {selectedDoctor?.profiles?.display_name}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          {new Date(scheduledAt).toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short' })}
        </p>
        <div className="inline-block px-3 py-1 rounded-lg text-sm font-medium mb-6"
          style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
          Ref: #{confirmation.appointment_number}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/portal/appointments')}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}>
            {tr.viewAppointments}
          </button>
          <button onClick={() => { setStep('doctor'); setSelectedDoctor(null); setScheduledAt(''); setComplaint('') }}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>
            {tr.bookAnother}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'details' && selectedDoctor) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="rounded-xl p-4 mb-5 flex items-center gap-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            {selectedDoctor.profiles?.display_name?.charAt(0) ?? 'D'}
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedDoctor.profiles?.display_name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedDoctor.specialty}</div>
          </div>
          <button onClick={() => setStep('doctor')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {tr.back}
          </button>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelCls}><Calendar size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />{tr.dateTime}</label>
              <input type="datetime-local" value={scheduledAt} min={getMinDate()} onChange={e => setScheduledAt(e.target.value)} style={{ ...inputCls, direction: 'ltr' }} required />
            </div>

            <div>
              <label style={labelCls}><Clock size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />{tr.appointmentType}</label>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setType(opt.value)} style={{
                    flex: 1, padding: '7px 4px', borderRadius: 8,
                    border: type === opt.value ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: type === opt.value ? 'var(--accent-light)' : 'var(--bg-surface)',
                    color: type === opt.value ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: type === opt.value ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelCls}><FileText size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />{tr.chiefComplaintLabel}</label>
              <textarea value={complaint} onChange={e => setComplaint(e.target.value)}
                placeholder={tr.chiefComplaintPlaceholder} rows={3}
                style={{ ...inputCls, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: 'var(--danger)', padding: '8px 12px', background: 'var(--danger-light)', borderRadius: 8 }}>{error}</div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('doctor')}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
                {tr.back}
              </button>
              <button type="button" onClick={handleBook} disabled={isPending || !scheduledAt} style={{
                flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 500,
                cursor: isPending || !scheduledAt ? 'not-allowed' : 'pointer',
                opacity: isPending || !scheduledAt ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {isPending ? <><Loader2 size={14} className="animate-spin" /> {tr.booking}</> : tr.confirmBooking}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      {doctors.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{tr.noDoctors}</div>
      ) : (
        Object.entries(bySpecialty).map(([specialty, docs]) => (
          <div key={specialty} className="mb-6">
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              {specialty}
            </h3>
            <div className="grid gap-2">
              {docs.map(doc => (
                <button key={doc.id} type="button" onClick={() => { setSelectedDoctor(doc); setStep('details') }}
                  className="w-full rounded-xl p-4 flex items-center gap-3 text-left transition-all hover:shadow-md"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                    {doc.profiles?.display_name?.charAt(0) ?? 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{doc.profiles?.display_name ?? 'Doctor'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{doc.specialty}</div>
                    {doc.consultation_fee && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>{doc.consultation_fee} EGP</div>}
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: isRtl ? 'rotate(180deg)' : undefined }} />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
