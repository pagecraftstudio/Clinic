export interface TimeSlot {
  time: string      // 'HH:MM'
  available: boolean
  reason?: 'booked' | 'leave' | 'outside_hours'
}

export interface DoctorProfile {
  id: string
  specialty: string
  sub_specialty: string | null
  consultation_fee: number
  follow_up_fee: number
  bio: string | null
  accepts_online: boolean
  working_hours: WorkingHours[]
  is_active: boolean
  profiles: {
    display_name: string
    first_name: string
    last_name: string
    avatar_url: string | null
  } | null
  rating?: {
    avg_rating: number
    total_ratings: number
  }
}

export interface WorkingHours {
  day: number       // 0=Sun … 6=Sat
  start: string     // 'HH:MM'
  end: string
  enabled: boolean
}

export interface WaitingListEntry {
  id: string
  doctor_id: string
  patient_id: string | null
  guest_name: string | null
  guest_phone: string | null
  preferred_date: string
  preferred_time: string
  type: string
  status: 'waiting' | 'notified' | 'booked' | 'cancelled' | 'expired'
  created_at: string
}

export interface BookingSettings {
  booking_approval_required: boolean
  cancellation_hours: number
  reschedule_hours: number
  booking_advance_days: number
  guest_booking_enabled: boolean
  ratings_enabled: boolean
  appointment_duration: number
  working_days: number[]
  working_hours_start: string
  working_hours_end: string
}
