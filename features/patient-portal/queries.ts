// Append these exports to the existing features/patient-portal/queries.ts
// DO NOT replace the file — add below getPortalClinicSettings

import { createAdminClient } from '@/lib/supabase/server'
import type { DoctorProfile, TimeSlot, BookingSettings } from '@/types/booking'

// ── Doctors with ratings ──────────────────────────────────────────────────────
export async function getPortalDoctorsWithRatings(): Promise<DoctorProfile[]> {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('doctors')
    .select(`
      id, specialty, sub_specialty, consultation_fee, follow_up_fee,
      bio, accepts_online, working_hours, is_active,
      profiles ( display_name, first_name, last_name, avatar_url )
    `)
    .eq('is_active', true)
    .order('specialty')

  if (!data?.length) return []

  // Fetch ratings from materialized view
  const ids = data.map(d => d.id)
  const { data: ratings } = await admin
    .from('doctor_rating_summary')
    .select('doctor_id, avg_rating, total_ratings')
    .in('doctor_id', ids)

  const ratingMap = Object.fromEntries(
    (ratings ?? []).map(r => [r.doctor_id, { avg_rating: Number(r.avg_rating), total_ratings: r.total_ratings }])
  )

  return data.map(d => ({ ...d, rating: ratingMap[d.id] })) as DoctorProfile[]
}

// ── Clinic booking settings ───────────────────────────────────────────────────
export async function getBookingSettings(): Promise<BookingSettings | null> {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('clinics')
    .select(`
      booking_approval_required, cancellation_hours, reschedule_hours,
      booking_advance_days, guest_booking_enabled, ratings_enabled,
      appointment_duration, working_days, working_hours_start, working_hours_end
    `)
    .eq('is_active', true)
    .limit(1)
    .single()
  return data ?? null
}

// ── Available slots for a doctor on a date ───────────────────────────────────
export async function getAvailableSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
  const admin = await createAdminClient()

  // Get doctor working hours and clinic slot duration
  const [{ data: doctor }, { data: clinic }] = await Promise.all([
    admin.from('doctors').select('working_hours').eq('id', doctorId).single(),
    admin.from('clinics').select('appointment_duration').limit(1).single(),
  ])

  const slotDuration = clinic?.appointment_duration ?? 30
  const dayOfWeek = new Date(date).getDay()
  const wh = (doctor?.working_hours ?? []) as Array<{ day: number; start: string; end: string; enabled: boolean }>
  const todayHours = wh.find(h => h.day === dayOfWeek && h.enabled)
  if (!todayHours) return []

  // Check doctor leaves
  const { data: leave } = await admin
    .from('doctor_leaves')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('status', 'approved')
    .lte('start_date', date)
    .gte('end_date', date)
    .limit(1)
  if (leave?.length) return []

  // Existing appointments on that day
  const { data: booked } = await admin
    .from('appointments')
    .select('scheduled_at, duration')
    .eq('doctor_id', doctorId)
    .gte('scheduled_at', `${date}T00:00:00`)
    .lte('scheduled_at', `${date}T23:59:59`)
    .is('deleted_at', null)
    .not('status', 'in', '(cancelled,no_show)')

  const bookedRanges = (booked ?? []).map(a => ({
    start: new Date(a.scheduled_at),
    end: new Date(new Date(a.scheduled_at).getTime() + a.duration * 60_000),
  }))

  // Generate slots
  const slots: TimeSlot[] = []
  const [sh, sm] = todayHours.start.split(':').map(Number)
  const [eh, em] = todayHours.end.split(':').map(Number)
  const now = new Date()

  let cursor = new Date(`${date}T${todayHours.start}:00`)
  const endTime = new Date(`${date}T${todayHours.end}:00`)

  while (cursor < endTime) {
    const slotEnd = new Date(cursor.getTime() + slotDuration * 60_000)
    if (slotEnd > endTime) break

    const time = cursor.toTimeString().slice(0, 5)
    const isPast = cursor <= now

    const clash = bookedRanges.some(r => cursor < r.end && slotEnd > r.start)

    slots.push({
      time,
      available: !isPast && !clash,
      reason: clash ? 'booked' : isPast ? undefined : undefined,
    })

    cursor = slotEnd
  }

  return slots
}

// ── Waiting list entries for current patient ──────────────────────────────────
export async function getPatientWaitingList(patientId: string) {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('waiting_list')
    .select(`
      id, preferred_date, preferred_time, type, status, created_at,
      doctors ( id, specialty, profiles ( display_name ) )
    `)
    .eq('patient_id', patientId)
    .not('status', 'in', '(cancelled,expired,booked)')
    .order('preferred_date')
  return data ?? []
}

// ── Doctor public profile ─────────────────────────────────────────────────────
export async function getDoctorPublicProfile(doctorId: string): Promise<DoctorProfile | null> {
  const admin = await createAdminClient()
  const [{ data: doctor }, { data: rating }] = await Promise.all([
    admin.from('doctors')
      .select(`id, specialty, sub_specialty, consultation_fee, follow_up_fee, bio, accepts_online, working_hours, is_active, profiles ( display_name, first_name, last_name, avatar_url )`)
      .eq('id', doctorId)
      .eq('is_active', true)
      .single(),
    admin.from('doctor_rating_summary')
      .select('avg_rating, total_ratings')
      .eq('doctor_id', doctorId)
      .single(),
  ])
  if (!doctor) return null
  return { ...doctor, rating: rating ? { avg_rating: Number(rating.avg_rating), total_ratings: rating.total_ratings } : undefined } as DoctorProfile
}

// ── Ratings for a doctor (public, non-anonymous) ──────────────────────────────
export async function getDoctorRatings(doctorId: string) {
  const admin = await createAdminClient()
  const { data } = await admin
    .from('doctor_ratings')
    .select(`rating, comment, is_anonymous, created_at, patients ( full_name )`)
    .eq('doctor_id', doctorId)
    .eq('is_anonymous', false)
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}
