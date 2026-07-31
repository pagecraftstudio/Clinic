'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { rescheduleAppointment } from '@/features/patient-portal/actions'
import { Loader2, Calendar, Clock } from 'lucide-react'
import { useLang } from '@/lib/i18n/context'
import type { TimeSlot } from '@/types/booking'

const inputCls: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg-surface)',
  color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

export function RescheduleClient({ appointmentId, doctorId, currentDate }: {
  appointmentId: string
  doctorId: string
  currentDate: string
}) {
  const { isRtl, lang } = useLang()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fetchSlots = useCallback(async (date: string) => {
    setSlotsLoading(true)
    try {
      const res = await fetch(`/api/portal/slots?doctor=${doctorId}&date=${date}`)
      const json = await res.json()
      setSlots(json.slots ?? [])
    } finally {
      setSlotsLoading(false)
    }
  }, [doctorId])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedSlot('')
    if (date) fetchSlots(date)
  }

  const handleReschedule = () => {
    if (!selectedDate || !selectedSlot) return
    setError(null)
    startTransition(async () => {
      const result = await rescheduleAppointment({
        appointment_id: appointmentId,
        scheduled_at: `${selectedDate}T${selectedSlot}:00`,
      })
      if (result.success) router.push('/portal/appointments')
      else setError(result.error ?? 'Failed to reschedule.')
    })
  }

  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB'
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)

  return (
    <div className="max-w-lg mx-auto px-4 py-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
        {lang === 'ar' ? 'إعادة جدولة الموعد' : 'Reschedule appointment'}
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        {lang === 'ar' ? 'اختر يوماً ووقتاً جديداً.' : 'Select a new date and time.'}
      </p>

      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>
            <Calendar size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />
            {lang === 'ar' ? 'التاريخ الجديد' : 'New date'}
          </label>
          <input type="date" value={selectedDate}
            min={minDate.toISOString().slice(0, 10)}
            onChange={e => handleDateChange(e.target.value)}
            style={{ ...inputCls, direction: 'ltr' }} />
        </div>

        {selectedDate && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
              <Clock size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />
              {lang === 'ar' ? 'الوقت' : 'Time'}
            </label>
            {slotsLoading ? (
              <div className="flex items-center justify-center py-4" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                <Loader2 size={14} className="animate-spin" style={{ marginInlineEnd: 6 }} />
                {lang === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
              </div>
            ) : slots.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {lang === 'ar' ? 'لا توجد مواعيد في هذا اليوم.' : 'No slots on this day.'}
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map(slot => (
                  <button key={slot.time} disabled={!slot.available} onClick={() => setSelectedSlot(slot.time)}
                    style={{
                      padding: '8px 4px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      border: selectedSlot === slot.time ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      background: selectedSlot === slot.time ? 'var(--accent-light)' : !slot.available ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      color: selectedSlot === slot.time ? 'var(--accent)' : !slot.available ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: slot.available ? 'pointer' : 'not-allowed', opacity: !slot.available ? 0.5 : 1,
                      textDecoration: !slot.available ? 'line-through' : undefined,
                    }}>
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <div style={{ fontSize: 13, color: 'var(--danger)', padding: '8px 12px', background: 'var(--danger-light)', borderRadius: 8, marginBottom: 12 }}>{error}</div>}

        <div className="flex gap-3">
          <button onClick={() => router.back()} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={handleReschedule} disabled={isPending || !selectedSlot} style={{
            flex: 2, padding: '10px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 500,
            cursor: isPending || !selectedSlot ? 'not-allowed' : 'pointer',
            opacity: isPending || !selectedSlot ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {isPending ? <><Loader2 size={14} className="animate-spin" />{lang === 'ar' ? 'جارٍ...' : 'Saving...'}</> : (lang === 'ar' ? 'تأكيد' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
