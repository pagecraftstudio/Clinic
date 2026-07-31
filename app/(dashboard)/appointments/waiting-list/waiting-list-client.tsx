'use client'

import { useState, useTransition } from 'react'
import { Clock, User, Phone, Calendar, X, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
  doctors: { id: string; specialty: string; profiles: { display_name: string } | null } | null
}

export function WaitingListClient({ entries: initial }: { entries: WaitingEntry[] }) {
  const [entries, setEntries] = useState(initial)
  const [isPending, startTransition] = useTransition()

  const updateStatus = (id: string, status: string) => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('waiting_list').update({ status, notified_at: status === 'notified' ? new Date().toISOString() : undefined }).eq('id', id)
      if (status === 'cancelled') {
        setEntries(prev => prev.filter(e => e.id !== id))
      } else {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e))
      }
    })
  }

  const TIME_LABELS: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', any: 'Any time' }

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
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
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

            return (
              <div key={entry.id} className="rounded-xl p-4"
                style={{ background: 'var(--bg-surface)', border: `1px solid ${isNotified ? 'var(--accent)' : 'var(--border)'}` }}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
                      {!entry.patients && (
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#F3F4F6', color: '#6B7280' }}>Guest</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: isNotified ? 'var(--accent-light)' : '#FEF3C7', color: isNotified ? 'var(--accent)' : '#D97706' }}>
                        {isNotified ? 'Notified' : 'Waiting'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <User size={11} /> {docName} · {entry.doctors?.specialty}
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
                    </div>

                    {entry.chief_complaint && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{entry.chief_complaint}</p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {!isNotified && (
                      <button onClick={() => updateStatus(entry.id, 'notified')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>
                        <Bell size={12} /> Notify
                      </button>
                    )}
                    <button onClick={() => updateStatus(entry.id, 'cancelled')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}>
                      <X size={12} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
