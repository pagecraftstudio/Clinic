'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  bookAppointment,
  bookAppointmentAsGuest,
  joinWaitingList,
} from '@/features/patient-portal/actions'
import { CheckCircle, Loader2, ChevronRight, Clock, FileText, Star, User, Phone, Mail, Calendar, AlertCircle } from 'lucide-react'
import { useLang } from '@/lib/i18n/context'
import type { DoctorProfile, TimeSlot, BookingSettings } from '@/types/booking'

const inputCls: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg-surface)',
  color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}
const labelCls: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)',
}

type Step = 'doctor' | 'date' | 'slot' | 'details' | 'guest' | 'done' | 'waitlist'

export function BookingClient({
  doctors,
  settings,
  isAuthenticated,
}: {
  doctors: DoctorProfile[]
  settings: BookingSettings | null
  isAuthenticated: boolean
}) {
  const { tr, isRtl, lang } = useLang()
  const searchParams = useSearchParams()
  const router = useRouter()

  const preselectedId = searchParams.get('doctor')

  const [step, setStep] = useState<Step>('doctor')
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(
    preselectedId ? (doctors.find(d => d.id === preselectedId) ?? null) : null
  )
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [type, setType] = useState('in_person')
  const [complaint, setComplaint] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [confirmation, setConfirmation] = useState<{ id: string; appointment_number: string; isPending?: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Waiting list state
  const [wlTime, setWlTime] = useState<'morning' | 'afternoon' | 'any'>('any')
  const [wlGuestName, setWlGuestName] = useState('')
  const [wlGuestPhone, setWlGuestPhone] = useState('')

  // Auto-advance if doctor preselected
  useEffect(() => {
    if (preselectedId && selectedDoctor) setStep('date')
  }, [preselectedId, selectedDoctor])

  const fetchSlots = useCallback(async (doctorId: string, date: string) => {
    setSlotsLoading(true)
    try {
      const res = await fetch(`/api/portal/slots?doctor=${doctorId}&date=${date}`)
      const json = await res.json()
      setSlots(json.slots ?? [])
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedSlot('')
    if (selectedDoctor && date) fetchSlots(selectedDoctor.id, date)
  }

  const handleBook = () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return
    setError(null)

    const scheduled_at = `${selectedDate}T${selectedSlot}:00`
    const duration = settings?.appointment_duration ?? 30

    startTransition(async () => {
      let result

      if (!isAuthenticated && settings?.guest_booking_enabled) {
        result = await bookAppointmentAsGuest({
          doctor_id: selectedDoctor.id,
          scheduled_at,
          duration,
          type,
          chief_complaint: complaint || undefined,
          guest_name: guestName,
          guest_phone: guestPhone,
          guest_email: guestEmail || undefined,
        })
      } else {
        result = await bookAppointment({
          doctor_id: selectedDoctor.id,
          scheduled_at,
          duration,
          type,
          chief_complaint: complaint || undefined,
        })
      }

      if (result.success && result.data) {
        setConfirmation({
          ...result.data,
          isPending: settings?.booking_approval_required,
        })
        setStep('done')
      } else {
        setError(result.error ?? 'Booking failed.')
      }
    })
  }

  const handleJoinWaitlist = () => {
    if (!selectedDoctor || !selectedDate) return
    setError(null)
    startTransition(async () => {
      const result = await joinWaitingList({
        doctor_id: selectedDoctor.id,
        preferred_date: selectedDate,
        preferred_time: wlTime,
        type,
        chief_complaint: complaint || undefined,
        guest_name: !isAuthenticated ? wlGuestName : undefined,
        guest_phone: !isAuthenticated ? wlGuestPhone : undefined,
      })
      if (result.success) setStep('done')
      else setError(result.error ?? 'Failed to join waiting list.')
    })
  }

  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB'
  const bySpecialty = doctors.reduce<Record<string, DoctorProfile[]>>((acc, d) => {
    const s = d.specialty || 'General'
    ;(acc[s] = acc[s] ?? []).push(d)
    return acc
  }, {})

  const maxDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + (settings?.booking_advance_days ?? 30))
    return d.toISOString().slice(0, 10)
  })()

  // ── Done ──────────────────────────────────────────────────────────────────
  if (step === 'done') {
    const isWaitlist = !confirmation
    return (
      <div className="rounded-2xl p-8 text-center" dir={isRtl ? 'rtl' : 'ltr'}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--accent-light)' }}>
          <CheckCircle size={28} style={{ color: 'var(--accent)' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          {isWaitlist
            ? (lang === 'ar' ? 'تمت الإضافة لقائمة الانتظار' : 'Added to waiting list')
            : (lang === 'ar' ? 'تم الحجز!' : 'Booking confirmed!')}
        </h2>
        {confirmation && (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
              {lang === 'ar' ? 'مع' : 'with'} {selectedDoctor?.profiles?.display_name}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              {new Date(`${selectedDate}T${selectedSlot}`).toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short' })}
            </p>
            {confirmation.isPending && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium mb-4"
                style={{ background: '#FEF3C7', color: '#D97706' }}>
                <AlertCircle size={11} />
                {lang === 'ar' ? 'في انتظار موافقة العيادة' : 'Pending clinic approval'}
              </div>
            )}
            <div className="inline-block px-3 py-1 rounded-lg text-sm font-medium mb-6"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
              Ref: #{confirmation.appointment_number}
            </div>
          </>
        )}
        <div className="flex gap-3 justify-center">
          {isAuthenticated && (
            <button onClick={() => router.push('/portal/appointments')}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}>
              {lang === 'ar' ? 'عرض المواعيد' : 'View appointments'}
            </button>
          )}
          <button onClick={() => { setStep('doctor'); setSelectedDoctor(null); setSelectedDate(''); setSelectedSlot(''); setComplaint('') }}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>
            {lang === 'ar' ? 'حجز آخر' : 'Book another'}
          </button>
        </div>
      </div>
    )
  }

  // ── Waitlist form ─────────────────────────────────────────────────────────
  if (step === 'waitlist') {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        <DoctorBadge doctor={selectedDoctor!} onBack={() => setStep('slot')} isRtl={isRtl} lang={lang} />
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            {lang === 'ar' ? 'الانضمام لقائمة الانتظار' : 'Join waiting list'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            {lang === 'ar'
              ? 'سيتم إعلامك عند توفر موعد مناسب.'
              : "We'll notify you when a suitable slot becomes available."}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelCls}>{lang === 'ar' ? 'الوقت المفضل' : 'Preferred time'}</label>
              <div className="flex gap-2">
                {(['morning', 'afternoon', 'any'] as const).map(t => (
                  <button key={t} onClick={() => setWlTime(t)} style={{
                    flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    border: wlTime === t ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: wlTime === t ? 'var(--accent-light)' : 'var(--bg-surface)',
                    color: wlTime === t ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer',
                  }}>
                    {lang === 'ar'
                      ? { morning: 'صباح', afternoon: 'مساء', any: 'أي وقت' }[t]
                      : { morning: 'Morning', afternoon: 'Afternoon', any: 'Any time' }[t]}
                  </button>
                ))}
              </div>
            </div>
            {!isAuthenticated && (
              <>
                <div>
                  <label style={labelCls}><User size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />{lang === 'ar' ? 'الاسم' : 'Your name'}</label>
                  <input value={wlGuestName} onChange={e => setWlGuestName(e.target.value)} style={inputCls} />
                </div>
                <div>
                  <label style={labelCls}><Phone size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />{lang === 'ar' ? 'الهاتف' : 'Phone'}</label>
                  <input value={wlGuestPhone} onChange={e => setWlGuestPhone(e.target.value)} style={{ ...inputCls, direction: 'ltr' }} />
                </div>
              </>
            )}
            {error && <div style={{ fontSize: 13, color: 'var(--danger)', padding: '8px 12px', background: 'var(--danger-light)', borderRadius: 8 }}>{error}</div>}
            <div className="flex gap-3">
              <button onClick={() => setStep('slot')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
              <button onClick={handleJoinWaitlist} disabled={isPending} style={{
                flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 500,
                cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {isPending ? <><Loader2 size={14} className="animate-spin" />{lang === 'ar' ? 'جارٍ...' : 'Saving...'}</> : (lang === 'ar' ? 'انضم للقائمة' : 'Join list')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Slot picker ───────────────────────────────────────────────────────────
  if (step === 'slot') {
    const availableSlots = slots.filter(s => s.available)
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        <DoctorBadge doctor={selectedDoctor!} onBack={() => setStep('date')} isRtl={isRtl} lang={lang} />
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
            {new Date(selectedDate).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          {slotsLoading ? (
            <div className="flex items-center justify-center py-8" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              <Loader2 size={16} className="animate-spin" style={{ marginInlineEnd: 8 }} />
              {lang === 'ar' ? 'جارٍ التحميل...' : 'Loading slots...'}
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-6">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                {lang === 'ar' ? 'لا توجد مواعيد في هذا اليوم.' : 'No availability on this date.'}
              </p>
              <button onClick={() => setStep('waitlist')}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                {lang === 'ar' ? 'انضم لقائمة الانتظار' : 'Join waiting list'}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {slots.map(slot => (
                  <button key={slot.time} disabled={!slot.available} onClick={() => setSelectedSlot(slot.time)}
                    style={{
                      padding: '8px 4px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      border: selectedSlot === slot.time ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      background: selectedSlot === slot.time ? 'var(--accent-light)'
                        : !slot.available ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      color: selectedSlot === slot.time ? 'var(--accent)'
                        : !slot.available ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: slot.available ? 'pointer' : 'not-allowed',
                      textDecoration: !slot.available ? 'line-through' : undefined,
                      opacity: !slot.available ? 0.5 : 1,
                    }}>
                    {slot.time}
                  </button>
                ))}
              </div>
              {availableSlots.length === 0 && (
                <div className="text-center pt-2">
                  <button onClick={() => setStep('waitlist')}
                    style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    {lang === 'ar' ? 'انضم لقائمة الانتظار' : 'Join waiting list'}
                  </button>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep('date')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
                  {lang === 'ar' ? 'رجوع' : 'Back'}
                </button>
                <button onClick={() => setStep(isAuthenticated ? 'details' : 'guest')}
                  disabled={!selectedSlot} style={{
                    flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                    background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 500,
                    cursor: !selectedSlot ? 'not-allowed' : 'pointer', opacity: !selectedSlot ? 0.5 : 1,
                  }}>
                  {lang === 'ar' ? 'التالي' : 'Next'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Date picker ───────────────────────────────────────────────────────────
  if (step === 'date' && selectedDoctor) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        <DoctorBadge doctor={selectedDoctor} onBack={() => setStep('doctor')} isRtl={isRtl} lang={lang} />
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <label style={labelCls}><Calendar size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />{lang === 'ar' ? 'اختر يوماً' : 'Select a date'}</label>
          <input type="date" value={selectedDate} min={new Date().toISOString().slice(0, 10)} max={maxDate}
            onChange={e => handleDateChange(e.target.value)}
            style={{ ...inputCls, direction: 'ltr' }} />
          <button onClick={() => setStep('slot')} disabled={!selectedDate} style={{
            marginTop: 16, width: '100%', padding: '10px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 500,
            cursor: !selectedDate ? 'not-allowed' : 'pointer', opacity: !selectedDate ? 0.5 : 1,
          }}>
            {lang === 'ar' ? 'عرض المواعيد المتاحة' : 'View available slots'}
          </button>
        </div>
      </div>
    )
  }

  // ── Guest details ─────────────────────────────────────────────────────────
  if (step === 'guest') {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        <DoctorBadge doctor={selectedDoctor!} onBack={() => setStep('slot')} isRtl={isRtl} lang={lang} />
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{lang === 'ar' ? 'بياناتك' : 'Your details'}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            {lang === 'ar' ? 'لا تحتاج لحساب لإتمام الحجز.' : 'No account needed to book.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelCls}><User size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />{lang === 'ar' ? 'الاسم الكامل *' : 'Full name *'}</label>
              <input value={guestName} onChange={e => setGuestName(e.target.value)} style={inputCls} required />
            </div>
            <div>
              <label style={labelCls}><Phone size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />{lang === 'ar' ? 'رقم الهاتف *' : 'Phone *'}</label>
              <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} style={{ ...inputCls, direction: 'ltr' }} type="tel" required />
            </div>
            <div>
              <label style={labelCls}><Mail size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />{lang === 'ar' ? 'البريد (اختياري)' : 'Email (optional)'}</label>
              <input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} style={{ ...inputCls, direction: 'ltr' }} type="email" />
            </div>
            <div>
              <label style={labelCls}><FileText size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />{lang === 'ar' ? 'سبب الزيارة (اختياري)' : 'Reason for visit (optional)'}</label>
              <textarea value={complaint} onChange={e => setComplaint(e.target.value)} rows={3}
                style={{ ...inputCls, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            {error && <div style={{ fontSize: 13, color: 'var(--danger)', padding: '8px 12px', background: 'var(--danger-light)', borderRadius: 8 }}>{error}</div>}
            <div className="flex gap-3">
              <button onClick={() => setStep('slot')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
              <button onClick={handleBook} disabled={isPending || !guestName || !guestPhone} style={{
                flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 500,
                cursor: isPending || !guestName || !guestPhone ? 'not-allowed' : 'pointer',
                opacity: isPending || !guestName || !guestPhone ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {isPending ? <><Loader2 size={14} className="animate-spin" />{lang === 'ar' ? 'جارٍ...' : 'Booking...'}</> : (lang === 'ar' ? 'تأكيد الحجز' : 'Confirm booking')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Appointment details (authenticated) ───────────────────────────────────
  if (step === 'details' && selectedDoctor) {
    const TYPE_OPTIONS = [
      { value: 'in_person', label: lang === 'ar' ? 'حضوري' : 'In person' },
      ...(selectedDoctor.accepts_online ? [{ value: 'online', label: lang === 'ar' ? 'أونلاين' : 'Online' }] : []),
      { value: 'home_visit', label: lang === 'ar' ? 'زيارة منزلية' : 'Home visit' },
    ]
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        <DoctorBadge doctor={selectedDoctor} onBack={() => setStep('slot')} isRtl={isRtl} lang={lang} />
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          {/* Selected slot recap */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ background: 'var(--accent-light)' }}>
            <Clock size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
              {new Date(selectedDate).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })} · {selectedSlot}
            </span>
            <button onClick={() => setStep('slot')} style={{ marginInlineStart: 'auto', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
              {lang === 'ar' ? 'تغيير' : 'Change'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelCls}>{lang === 'ar' ? 'نوع الموعد' : 'Appointment type'}</label>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setType(opt.value)} style={{
                    flex: 1, padding: '7px 4px', borderRadius: 8,
                    border: type === opt.value ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: type === opt.value ? 'var(--accent-light)' : 'var(--bg-surface)',
                    color: type === opt.value ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: type === opt.value ? 600 : 400, cursor: 'pointer',
                  }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelCls}><FileText size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />{lang === 'ar' ? 'سبب الزيارة (اختياري)' : 'Reason for visit (optional)'}</label>
              <textarea value={complaint} onChange={e => setComplaint(e.target.value)} rows={3}
                style={{ ...inputCls, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            {error && <div style={{ fontSize: 13, color: 'var(--danger)', padding: '8px 12px', background: 'var(--danger-light)', borderRadius: 8 }}>{error}</div>}
            <div className="flex gap-3">
              <button onClick={() => setStep('slot')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
              <button onClick={handleBook} disabled={isPending} style={{
                flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 500,
                cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {isPending ? <><Loader2 size={14} className="animate-spin" />{lang === 'ar' ? 'جارٍ...' : 'Booking...'}</> : (lang === 'ar' ? 'تأكيد الحجز' : 'Confirm booking')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Doctor picker ─────────────────────────────────────────────────────────
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      {!isAuthenticated && settings?.guest_booking_enabled && (
        <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2"
          style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
          <User size={13} style={{ color: '#6366F1', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#4338CA' }}>
            {lang === 'ar'
              ? 'يمكنك الحجز كزائر بدون تسجيل دخول.'
              : 'You can book as a guest without signing in.'}
          </span>
        </div>
      )}
      {doctors.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {lang === 'ar' ? 'لا يوجد أطباء متاحون.' : 'No doctors available.'}
        </div>
      ) : (
        Object.entries(bySpecialty).map(([specialty, docs]) => (
          <div key={specialty} className="mb-6">
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              {specialty}
            </h3>
            <div className="grid gap-2">
              {docs.map(doc => (
                <button key={doc.id} onClick={() => { setSelectedDoctor(doc); setStep('date') }}
                  className="w-full rounded-xl p-4 flex items-center gap-3 text-left transition-all hover:shadow-md"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                    {doc.profiles?.avatar_url
                      ? <img src={doc.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      : doc.profiles?.display_name?.charAt(0) ?? 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{doc.profiles?.display_name ?? 'Doctor'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{doc.specialty}</div>
                    <div className="flex items-center gap-3 mt-1">
                      {doc.consultation_fee > 0 && (
                        <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{doc.consultation_fee} EGP</span>
                      )}
                      {doc.rating && doc.rating.total_ratings > 0 && (
                        <span className="flex items-center gap-0.5" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          <Star size={10} fill="var(--accent)" style={{ color: 'var(--accent)' }} />
                          {doc.rating.avg_rating.toFixed(1)} ({doc.rating.total_ratings})
                        </span>
                      )}
                    </div>
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

function DoctorBadge({ doctor, onBack, isRtl, lang }: { doctor: DoctorProfile; onBack: () => void; isRtl: boolean; lang: string }) {
  return (
    <div className="rounded-xl p-4 mb-5 flex items-center gap-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
        {doctor.profiles?.display_name?.charAt(0) ?? 'D'}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 14, fontWeight: 600 }}>{doctor.profiles?.display_name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{doctor.specialty}</div>
      </div>
      <button onClick={onBack} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        {lang === 'ar' ? 'تغيير' : 'Change'}
      </button>
    </div>
  )
}
