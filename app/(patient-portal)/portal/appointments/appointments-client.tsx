'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelPatientAppointment } from '@/features/patient-portal/actions'
import { Calendar, Clock, Video, MapPin, X, Loader2, Hourglass } from 'lucide-react'
import { useLang } from '@/lib/i18n/context'

interface WaitingEntry {
  id: string
  preferred_date: string
  preferred_time: string
  type: string
  status: string
  created_at: string
  doctors: { id: string; specialty: string; profiles: { display_name: string } | null } | null
}

interface Doctor {
  id: string; specialty: string
  profiles: { display_name: string; avatar_url: string | null } | null
}
interface Appointment {
  id: string; appointment_number: string; scheduled_at: string; end_at: string
  duration: number; type: string; status: string; chief_complaint: string | null
  is_online: boolean; online_link: string | null; doctors: Doctor | null
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  scheduled:  { bg: '#EEF2FF', color: '#6366F1' },
  confirmed:  { bg: 'var(--accent-light)', color: 'var(--accent)' },
  checked_in: { bg: '#F0FDF4', color: '#16A34A' },
  completed:  { bg: 'var(--bg-subtle)', color: 'var(--text-muted)' },
  cancelled:  { bg: 'var(--danger-light)', color: 'var(--danger)' },
  no_show:    { bg: '#FFF7ED', color: '#D97706' },
}

function AppointmentCard({ appt, onCancel }: { appt: Appointment; onCancel: (id: string) => void }) {
  const { tr, isRtl, lang } = useLang()
  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB'
  const isFuture = new Date(appt.scheduled_at) > new Date()
  const canCancel = isFuture && !['cancelled', 'completed', 'no_show'].includes(appt.status)
  const docName = appt.doctors?.profiles?.display_name ?? 'Doctor'
  const statusStyle = STATUS_COLORS[appt.status] ?? { bg: 'var(--bg-subtle)', color: 'var(--text-muted)' }
  const statusLabel = (tr.status as any)[appt.status] ?? appt.status

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            {docName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div style={{ fontSize: 14, fontWeight: 600 }}>{docName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{appt.doctors?.specialty}</div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <Calendar size={11} />
                {new Date(appt.scheduled_at).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <Clock size={11} />
                {new Date(appt.scheduled_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} · {appt.duration}{tr.duration}
              </span>
              {appt.is_online ? (
                <span className="flex items-center gap-1" style={{ fontSize: 11, color: '#6366F1' }}>
                  <Video size={10} /> {tr.online}
                </span>
              ) : (
                <span className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <MapPin size={10} /> {tr.inPerson}
                </span>
              )}
            </div>
            {appt.chief_complaint && (
              <div className="mt-1.5" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {tr.chiefComplaint}: {appt.chief_complaint}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span style={{ background: statusStyle.bg, color: statusStyle.color, fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99 }}>
            {statusLabel}
          </span>
          {canCancel && (
            <button onClick={() => onCancel(appt.id)}
              className="flex items-center gap-1 text-xs transition-colors hover:text-red-600"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={11} /> {tr.cancel}
            </button>
          )}
          {appt.is_online && appt.online_link && appt.status === 'confirmed' && (
            <a href={appt.online_link} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
              {tr.joinOnline} →
            </a>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        #{appt.appointment_number}
      </div>
    </div>
  )
}

export function PatientAppointmentsClient({ appointments, waitingList = [] }: { appointments: Appointment[]; waitingList?: WaitingEntry[] }) {
  const { tr, isRtl, lang } = useLang()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const now = new Date()
  const upcoming = appointments.filter(a => new Date(a.scheduled_at) >= now && a.status !== 'cancelled')
  const past = appointments.filter(a => new Date(a.scheduled_at) < now || a.status === 'cancelled')

  async function handleCancel(id: string) {
    if (!confirm(tr.confirmCancel)) return
    setCancelling(id)
    setError(null)
    const result = await cancelPatientAppointment(id)
    setCancelling(null)
    if (!result.success) setError(result.error ?? 'Failed to cancel')
    else router.refresh()
  }

  const shown = tab === 'upcoming' ? upcoming : past
  const tabStyle = (active: boolean) => ({
    padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'white' : 'var(--text-muted)',
  })

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex gap-1 mb-5 p-1 rounded-lg w-fit" style={{ background: 'var(--bg-subtle)' }}>
        <button style={tabStyle(tab === 'upcoming')} onClick={() => setTab('upcoming')}>
          {tr.upcoming} ({upcoming.length})
        </button>
        <button style={tabStyle(tab === 'past')} onClick={() => setTab('past')}>
          {tr.past} ({past.length})
        </button>
      </div>

      {waitingList.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Hourglass size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {lang === 'ar' ? 'قائمة الانتظار' : 'Waiting List'} ({waitingList.length})
            </span>
          </div>
          <div className="grid gap-2">
            {waitingList.map(entry => {
              const docName = entry.doctors?.profiles?.display_name ?? 'Doctor'
              const TIME_LABELS: Record<string, string> = { morning: lang === 'ar' ? 'صباح' : 'Morning', afternoon: lang === 'ar' ? 'مساء' : 'Afternoon', any: lang === 'ar' ? 'أي وقت' : 'Any time' }
              return (
                <div key={entry.id} className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                        style={{ background: '#FEF3C7', color: '#D97706' }}>
                        {docName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{docName}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            <Calendar size={10} />
                            {new Date(entry.preferred_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{TIME_LABELS[entry.preferred_time] ?? entry.preferred_time}</span>
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: '#FEF3C7', color: '#D97706', flexShrink: 0 }}>
                      {lang === 'ar' ? 'انتظار' : 'Waiting'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--danger-light)', color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <Calendar size={32} className="mx-auto mb-3 opacity-30" />
          <p style={{ fontSize: 14 }}>{tr.noAppointments}</p>
          {tab === 'upcoming' && (
            <a href="/portal/appointments/new"
              style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
              {tr.bookFirst} →
            </a>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {shown.map(a => (
            <div key={a.id} style={{ position: 'relative' }}>
              {cancelling === a.id && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                  <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent)' }} />
                </div>
              )}
              <AppointmentCard appt={a} onCancel={handleCancel} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
