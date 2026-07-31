'use client'

import { useState, useTransition } from 'react'
import { Clock, User, Phone, Calendar, X, Bell, CheckCircle, ChevronDown, ChevronUp, AlertCircle, Stethoscope } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { approveFromWaitingList } from '@/features/appointments/actions'

interface WaitingEntry {
  id: string
  preferred_date: string
  preferred_time: string
  type: string
  status: string
  chief_complaint: string | null
  guest_name: string | null
  guest_phone: string | null
  created_at: string
  patients: { id: string; full_name: string; phone: string; patient_number: string } | null
  doctors: { id: string; specialty: string; clinic_id: string; profiles: { display_name: string } | null } | null
}

interface ExistingAppt {
  id: string
  scheduled_at: string
  end_at: string
  duration: number
  patients: { full_name: string } | null
  guest_name: string | null
}

const TIME_LABELS: Record<string, string> = {
  morning: 'Morning (8AM–12PM)',
  afternoon: 'Afternoon (12PM–6PM)',
  any: 'Any time',
}

const TYPE_LABELS: Record<string, string> = {
  in_person: 'In Person',
  online: 'Online',
  home_visit: 'Home Visit',
  follow_up: 'Follow-up',
  urgent: 'Urgent',
  routine: 'Routine',
}

// Generate time slots every 15 min across the day
function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 7; h < 21; h++) {
    for (const m of [0, 15, 30, 45]) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

function isOverlapping(
  slotISO: string,
  duration: number,
  existing: ExistingAppt[]
): ExistingAppt | null {
  const start = new Date(slotISO).getTime()
  const end = start + duration * 60000
  for (const a of existing) {
    const as = new Date(a.scheduled_at).getTime()
    const ae = new Date(a.end_at).getTime()
    if (start < ae && end > as) return a
  }
  return null
}

function ApprovePanel({
  entry,
  onDone,
  onClose,
}: {
  entry: WaitingEntry
  onDone: (id: string) => void
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [date, setDate] = useState(entry.preferred_date)
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(30)
  const [existingAppts, setExistingAppts] = useState<ExistingAppt[]>([])
  const [loadingAppts, setLoadingAppts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const allSlots = generateTimeSlots()
  const doctorId = entry.doctors?.id ?? ''

  const loadAppts = async (d: string) => {
    if (!doctorId || !d) return
    setLoadingAppts(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('appointments')
      .select('id, scheduled_at, end_at, duration, patients(full_name), guest_name')
      .eq('doctor_id', doctorId)
      .gte('scheduled_at', `${d}T00:00:00`)
      .lte('scheduled_at', `${d}T23:59:59`)
      .is('deleted_at', null)
      .not('status', 'in', '(cancelled,no_show)')
      .order('scheduled_at')
    setExistingAppts((data ?? []) as ExistingAppt[])
    setLoadingAppts(false)
  }

  const handleDateChange = (d: string) => {
    setDate(d)
    setTime('')
    loadAppts(d)
  }

  const handleApprove = () => {
    if (!time || !date) return
    if (!entry.patients?.id) {
      setError('Guest must be registered as a patient before approving.')
      return
    }
    setError(null)
    const scheduled_at = `${date}T${time}:00`
    const conflict = isOverlapping(scheduled_at, duration, existingAppts)
    if (conflict) {
      const t = new Date(conflict.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      setError(`Conflicts with appointment at ${t} (${conflict.patients?.full_name ?? conflict.guest_name ?? 'patient'})`)
      return
    }
    startTransition(async () => {
      const result = await approveFromWaitingList({
        waiting_list_id: entry.id,
        doctor_id: doctorId,
        patient_id: entry.patients!.id,
        scheduled_at,
        duration,
        type: entry.type,
        chief_complaint: entry.chief_complaint,
      })
      if (result.success) {
        setSuccess(true)
        setTimeout(() => onDone(entry.id), 800)
      } else {
        setError(result.error ?? 'Failed to approve.')
      }
    })
  }

  if (success) {
    return (
      <div className="mt-3 p-3 rounded-xl flex items-center gap-2"
        style={{ background: '#F0FDF4', border: '1px solid #86EFAC' }}>
        <CheckCircle size={14} style={{ color: '#16A34A' }} />
        <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 500 }}>Appointment created!</span>
      </div>
    )
  }

  return (
    <div className="mt-3 p-4 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
        Assign appointment slot
      </div>

      {/* Date */}
      <div className="flex gap-3 mb-3 flex-wrap">
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Date</label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => handleDateChange(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: '0 0 90px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>Duration (min)</label>
          <select
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 13, outline: 'none' }}
          >
            {[15, 20, 30, 45, 60, 90].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Time slots */}
      {date && (
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
            Time {loadingAppts && <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>loading…</span>}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
            {allSlots.map(slot => {
              const slotISO = `${date}T${slot}:00`
              const conflict = isOverlapping(slotISO, duration, existingAppts)
              const isSelected = slot === time
              return (
                <button
                  key={slot}
                  disabled={!!conflict}
                  onClick={() => { setTime(slot); setError(null) }}
                  title={conflict ? `Taken by ${conflict.patients?.full_name ?? conflict.guest_name ?? 'patient'}` : slot}
                  style={{
                    padding: '5px 2px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: isSelected ? 600 : 400,
                    border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: isSelected
                      ? 'var(--accent-light)'
                      : conflict
                        ? '#FEE2E2'
                        : 'var(--bg-surface)',
                    color: isSelected
                      ? 'var(--accent)'
                      : conflict
                        ? '#EF4444'
                        : 'var(--text-primary)',
                    cursor: conflict ? 'not-allowed' : 'pointer',
                    textDecoration: conflict ? 'line-through' : 'none',
                    opacity: conflict ? 0.6 : 1,
                  }}
                >
                  {slot}
                </button>
              )
            })}
          </div>

          {/* Existing appts legend */}
          {existingAppts.length > 0 && (
            <div className="mt-3">
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>
                Booked on this day ({existingAppts.length}):
              </div>
              <div className="flex flex-col gap-1">
                {existingAppts.map(a => (
                  <div key={a.id} className="flex items-center gap-2" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0, display: 'inline-block' }} />
                    {new Date(a.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(a.end_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {a.patients?.full_name ?? a.guest_name ?? 'Guest'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg"
          style={{ background: 'var(--danger-light)', color: 'var(--danger)', fontSize: 12 }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button onClick={onClose}
          style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
          Cancel
        </button>
        <button
          onClick={handleApprove}
          disabled={!time || !date || isPending}
          style={{
            flex: 2, padding: '8px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 500,
            cursor: !time || !date || isPending ? 'not-allowed' : 'pointer',
            opacity: !time || !date || isPending ? 0.6 : 1,
          }}>
          {isPending ? 'Creating…' : `Approve → ${time || '–'}`}
        </button>
      </div>
    </div>
  )
}

export function WaitingListClient({ entries: initial }: { entries: WaitingEntry[] }) {
  const [entries, setEntries] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const updateStatus = (id: string, status: string) => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase
        .from('waiting_list')
        .update({ status, notified_at: status === 'notified' ? new Date().toISOString() : undefined })
        .eq('id', id)
      if (status === 'cancelled') {
        setEntries(prev => prev.filter(e => e.id !== id))
      } else {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
      }
    })
  }

  const handleApproved = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    setExpandedId(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Waiting List</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {entries.length} patient{entries.length !== 1 ? 's' : ''} waiting
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <Clock size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>Waiting list is empty</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {entries.map(entry => {
            const name = entry.patients?.full_name ?? entry.guest_name ?? 'Unknown'
            const phone = entry.patients?.phone ?? entry.guest_phone
            const docName = entry.doctors?.profiles?.display_name ?? 'Doctor'
            const isNotified = entry.status === 'notified'
            const isExpanded = expandedId === entry.id

            return (
              <div key={entry.id} className="rounded-xl p-4"
                style={{ background: 'var(--bg-surface)', border: `1px solid ${isExpanded ? 'var(--accent)' : isNotified ? 'var(--accent)' : 'var(--border)'}` }}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
                      {!entry.patients && (
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#FEF3C7', color: '#D97706' }}>Guest — register to approve</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: isNotified ? 'var(--accent-light)' : '#FEF3C7',
                          color: isNotified ? 'var(--accent)' : '#D97706',
                        }}>
                        {isNotified ? 'Notified' : 'Waiting'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <Stethoscope size={11} /> {docName} · {entry.doctors?.specialty}
                      </span>
                      <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <Calendar size={11} />
                        {new Date(entry.preferred_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' · '}{TIME_LABELS[entry.preferred_time] ?? entry.preferred_time}
                      </span>
                      {phone && (
                        <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          <Phone size={11} /> {phone}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {TYPE_LABELS[entry.type] ?? entry.type}
                      </span>
                    </div>

                    {entry.chief_complaint && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{entry.chief_complaint}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                      style={{ background: isExpanded ? 'var(--accent)' : 'var(--accent-light)', color: isExpanded ? 'white' : 'var(--accent)', border: 'none', cursor: 'pointer' }}>
                      <CheckCircle size={12} />
                      Approve
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                    {!isNotified && (
                      <button onClick={() => updateStatus(entry.id, 'notified')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                        style={{ background: '#EEF2FF', color: '#6366F1', border: 'none', cursor: 'pointer' }}>
                        <Bell size={12} /> Notify
                      </button>
                    )}
                    <button onClick={() => updateStatus(entry.id, 'cancelled')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}>
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* Inline approve panel */}
                {isExpanded && (
                  <ApprovePanel
                    entry={entry}
                    onDone={handleApproved}
                    onClose={() => setExpandedId(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
