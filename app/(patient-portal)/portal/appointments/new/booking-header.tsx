'use client'
import { useLang } from '@/lib/i18n/context'

export function BookingHeader() {
  const { tr, isRtl } = useLang()
  return (
    <div className="mb-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{tr.bookAppointmentTitle}</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{tr.selectDoctor}</p>
    </div>
  )
}
