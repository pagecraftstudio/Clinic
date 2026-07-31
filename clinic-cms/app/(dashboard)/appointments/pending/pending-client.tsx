'use client'

import { useState, useTransition } from 'react'
import { Check, X, Loader2, Clock, User, Phone, Calendar, AlertCircle } from 'lucide-react'
import { approveAppointment } from '@/features/patient-portal/actions'

interface PendingAppointment {
  id: string
  appointment_number: string
  scheduled_at: string
  duration: number
  type: string
  chief_complaint: string | null
  is_guest: boolean
  guest_name: string | null
  guest_phone: string | null
  guest_email: string | null
  created_at: string
  patients: { id: string; full_name: string; phone: string; patient_number: string } | null
  doctors: { id: string; specialty: string; profiles: { display_name: string } | null } | null
}

export function PendingAppointmentsClient({ appointments }: { appointments: PendingAppointment[] }) {
  const [list, setList] = useState(appointments)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const [acting, setActing] = useState<string | null>(null)

  const handle = (id: string, action: 'approved' | 'rejected', reason?: string) => {
    setActing(id)
    startTransition(async () => {
      const result = await approveAppointment(id, action, reason)
      if (result.success) {
        setList(prev => prev.filter(a => a.id !== id))
        setRejecting(null)
      }
      setActing(null)
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Pending Approvals</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {list.length} appointment{list.length !== 1 ? 's' : ''} awaiting approval
          </p>
        </div>
        {list.length > 0 && (
          <div className="px-3 py-1 rounded-full text-sm font-semibold"
            style={{ background: '#FEF3C7', color: '#D97706' }}>
            {list.length} pending
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <Check size={32} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>All caught up!</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>No pending appointments.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map(appt => {
            const patientName = appt.is_guest ? (appt.guest_name ?? 'Guest') : (appt.patients?.full_name ?? 'Unknown')
            const patientPhone = appt.is_guest ? appt.guest_phone : appt.patients?.phone
            const docName = appt.doctors?.profiles?.display_name ?? 'Doctor'

            return (
              <div key={appt.id} className="rounded-xl p-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{patientName}</span>
                      {appt.is_guest && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: '#F3F4F6', color: '#6B7280' }}>Guest</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: '#FEF3C7', color: '#D97706' }}>Pending</span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <User size={11} /> {docName} · {appt.doctors?.specialty}
                      </span>
                      <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <Calendar size={11} />
                        {new Date(appt.scheduled_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <Clock size={11} /> {appt.duration} min · {appt.type.replace('_', ' ')}
                      </span>
                      {patientPhone && (
                        <span className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          <Phone size={11} /> {patientPhone}
                        </span>
                      )}
                    </div>

                    {appt.chief_complaint && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                        <AlertCircle size={10} style={{ display: 'inline', marginInlineEnd: 4 }} />
                        {appt.chief_complaint}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {rejecting === appt.id ? (
                      <div className="flex flex-col gap-2" style={{ minWidth: 200 }}>
                        <input
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          placeholder="Rejection reason (optional)"
                          style={{
                            padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
                            background: 'var(--bg-surface)', fontSize: 12, outline: 'none', width: '100%',
                            boxSizing: 'border-box',
                          }}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setRejecting(null)}
                            style={{ flex: 1, padding: '6px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            Cancel
                          </button>
                          <button onClick={() => handle(appt.id, 'rejected', rejectionReason)}
                            disabled={acting === appt.id}
                            style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', background: 'var(--danger)', color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                            {acting === appt.id ? <Loader2 size={12} className="animate-spin" /> : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => { setRejecting(appt.id); setRejectionReason('') }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}>
                          <X size={13} /> Reject
                        </button>
                        <button onClick={() => handle(appt.id, 'approved')}
                          disabled={acting === appt.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                          style={{ background: 'var(--accent)', color: 'white', border: 'none', cursor: acting === appt.id ? 'not-allowed' : 'pointer' }}>
                          {acting === appt.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <><Check size={13} /> Approve</>}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  #{appt.appointment_number} · Booked {new Date(appt.created_at).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
