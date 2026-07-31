// PATCH for appointments-client.tsx
// In AppointmentCard, add these two actions alongside the cancel button:

// 1. Reschedule button (add below canCancel check):
//    const canReschedule = isFuture && !['cancelled', 'completed', 'no_show'].includes(appt.status)
//
// 2. Rate button (completed past appointments):
//    const canRate = !isFuture && appt.status === 'completed' && !appt.has_rating

// ── Drop-in AppointmentCard addition ─────────────────────────────────────────
// Replace the existing action buttons block with:

/*
<div className="flex flex-col items-end gap-2 flex-shrink-0">
  <span style={...statusStyle badge...}>{statusLabel}</span>

  {canReschedule && (
    <Link href={`/portal/appointments/reschedule?id=${appt.id}`}
      style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
      <RefreshCw size={10} style={{ display: 'inline', marginInlineEnd: 3 }} />
      {tr.reschedule ?? 'Reschedule'}
    </Link>
  )}

  {canCancel && (
    <button onClick={() => onCancel(appt.id)} className="flex items-center gap-1 text-xs transition-colors hover:text-red-600"
      style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      <X size={11} /> {tr.cancel}
    </button>
  )}

  {canRate && (
    <button onClick={() => onRate(appt)}
      style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
      <Star size={10} /> {tr.rate ?? 'Rate'}
    </button>
  )}

  {appt.is_online && appt.online_link && appt.status === 'confirmed' && (
    <a href={appt.online_link} target="_blank" rel="noopener noreferrer"
      style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
      {tr.joinOnline} →
    </a>
  )}
</div>
*/

// ── RatingDialog component (add to appointments-client.tsx) ──────────────────

'use client'

import { useState, useTransition } from 'react'
import { Star, X, Loader2 } from 'lucide-react'
import { submitDoctorRating } from '@/features/patient-portal/actions'

interface RatingDialogProps {
  appointment: { id: string; doctor_id: string; doctors: { profiles: { display_name: string } | null } | null }
  onClose: () => void
  lang: string
}

export function RatingDialog({ appointment, onClose, lang }: RatingDialogProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  const docName = appointment.doctors?.profiles?.display_name ?? 'Doctor'

  const handleSubmit = () => {
    if (!rating) return
    startTransition(async () => {
      const result = await submitDoctorRating({
        appointment_id: appointment.id,
        doctor_id: appointment.doctor_id,
        rating,
        comment: comment || undefined,
        is_anonymous: isAnonymous,
      })
      if (result.success) setDone(true)
      else setError(result.error ?? 'Failed to submit.')
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 16,
        padding: 24, maxWidth: 380, width: '100%', position: 'relative',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, insetInlineEnd: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>

        {done ? (
          <div className="text-center py-4">
            <Star size={32} fill="var(--accent)" style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>{lang === 'ar' ? 'شكراً لتقييمك!' : 'Thanks for your rating!'}</p>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              {lang === 'ar' ? 'قيّم الطبيب' : 'Rate your doctor'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{docName}</p>

            {/* Stars */}
            <div className="flex gap-2 justify-center mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i}
                  onMouseEnter={() => setHovered(i + 1)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(i + 1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <Star size={28}
                    fill={(hovered || rating) > i ? 'var(--accent)' : 'none'}
                    style={{ color: 'var(--accent)', transition: 'fill 0.1s' }} />
                </button>
              ))}
            </div>

            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder={lang === 'ar' ? 'اكتب تعليقك (اختياري)…' : 'Write a comment (optional)…'}
              rows={3} style={{
                width: '100%', padding: '9px 12px', borderRadius: 8, marginBottom: 12,
                border: '1px solid var(--border)', background: 'var(--bg-surface)',
                color: 'var(--text-primary)', fontSize: 13, resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }} />

            <label className="flex items-center gap-2 mb-4" style={{ fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
              {lang === 'ar' ? 'نشر بشكل مجهول' : 'Post anonymously'}
            </label>

            {error && <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{error}</div>}

            <button onClick={handleSubmit} disabled={!rating || isPending} style={{
              width: '100%', padding: '10px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 500,
              cursor: !rating || isPending ? 'not-allowed' : 'pointer',
              opacity: !rating || isPending ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {isPending ? <><Loader2 size={14} className="animate-spin" />{lang === 'ar' ? 'جارٍ...' : 'Submitting...'}</> : (lang === 'ar' ? 'إرسال التقييم' : 'Submit rating')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
