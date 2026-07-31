'use client'

import { useRouter } from 'next/navigation'
import { Star, MapPin, Video, Clock, ChevronLeft, Award } from 'lucide-react'
import { useLang } from '@/lib/i18n/context'
import type { DoctorProfile } from '@/types/booking'

const DAYS: Record<number, { en: string; ar: string }> = {
  0: { en: 'Sun', ar: 'أحد' },
  1: { en: 'Mon', ar: 'اثن' },
  2: { en: 'Tue', ar: 'ثلا' },
  3: { en: 'Wed', ar: 'أرب' },
  4: { en: 'Thu', ar: 'خمي' },
  5: { en: 'Fri', ar: 'جمع' },
  6: { en: 'Sat', ar: 'سبت' },
}

interface Rating {
  rating: number
  comment: string | null
  is_anonymous: boolean
  created_at: string
  patients: { full_name: string } | null
}

export function DoctorProfileClient({ doctor, ratings }: { doctor: DoctorProfile; ratings: Rating[] }) {
  const { isRtl, lang } = useLang()
  const router = useRouter()
  const name = doctor.profiles?.display_name ?? 'Doctor'
  const avgRating = doctor.rating?.avg_rating ?? 0
  const totalRatings = doctor.rating?.total_ratings ?? 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 mb-5 text-sm"
        style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <ChevronLeft size={14} style={{ transform: isRtl ? 'rotate(180deg)' : undefined }} />
        {lang === 'ar' ? 'رجوع' : 'Back'}
      </button>

      {/* Header card */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-bold"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            {doctor.profiles?.avatar_url
              ? <img src={doctor.profiles.avatar_url} alt={name} className="w-full h-full rounded-2xl object-cover" />
              : name.charAt(0)
            }
          </div>
          <div className="flex-1 min-w-0">
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{name}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
              {doctor.specialty}{doctor.sub_specialty ? ` · ${doctor.sub_specialty}` : ''}
            </div>
            {totalRatings > 0 && (
              <div className="flex items-center gap-1" style={{ fontSize: 13 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} fill={i < Math.round(avgRating) ? 'var(--accent)' : 'none'}
                    style={{ color: 'var(--accent)' }} />
                ))}
                <span style={{ color: 'var(--text-secondary)', marginInlineStart: 4 }}>
                  {avgRating.toFixed(1)} ({totalRatings})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fees */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
              {lang === 'ar' ? 'رسوم الكشف' : 'Consultation'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
              {doctor.consultation_fee} EGP
            </div>
          </div>
          {doctor.follow_up_fee > 0 && (
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                {lang === 'ar' ? 'متابعة' : 'Follow-up'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{doctor.follow_up_fee} EGP</div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {doctor.accepts_online && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
              style={{ background: '#EEF2FF', color: '#6366F1' }}>
              <Video size={10} /> {lang === 'ar' ? 'يقبل أونلاين' : 'Accepts online'}
            </span>
          )}
        </div>
      </div>

      {/* Bio */}
      {doctor.bio && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            {lang === 'ar' ? 'نبذة' : 'About'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{doctor.bio}</p>
        </div>
      )}

      {/* Working hours */}
      {doctor.working_hours?.length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            <Clock size={13} style={{ color: 'var(--accent)' }} />
            {lang === 'ar' ? 'مواعيد العمل' : 'Working hours'}
          </h2>
          <div className="grid gap-1">
            {doctor.working_hours.filter(h => h.enabled).map(h => (
              <div key={h.day} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>{DAYS[h.day]?.[lang] ?? h.day}</span>
                <span style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {h.start} – {h.end}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ratings */}
      {ratings.length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            <Award size={13} style={{ color: 'var(--accent)' }} />
            {lang === 'ar' ? 'آراء المرضى' : 'Patient reviews'}
          </h2>
          <div className="grid gap-3">
            {ratings.map((r, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: 'var(--bg-subtle)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 12, fontWeight: 500 }}>
                    {r.patients?.full_name ?? (lang === 'ar' ? 'مريض' : 'Patient')}
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={10} fill={j < r.rating ? 'var(--accent)' : 'none'}
                        style={{ color: 'var(--accent)' }} />
                    ))}
                  </div>
                </div>
                {r.comment && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book CTA */}
      <button
        onClick={() => router.push(`/portal/appointments/new?doctor=${doctor.id}`)}
        style={{
          width: '100%', padding: '12px', borderRadius: 12, border: 'none',
          background: 'var(--accent)', color: 'white', fontSize: 15, fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {lang === 'ar' ? 'احجز موعداً' : 'Book appointment'}
      </button>
    </div>
  )
}
