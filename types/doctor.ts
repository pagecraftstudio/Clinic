export type DoctorStatus = 'active' | 'inactive' | 'on_leave'

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface WorkingHours {
  day: DayOfWeek
  is_active: boolean
  start_time: string   // "HH:MM"
  end_time: string     // "HH:MM"
  break_start?: string | null
  break_end?: string | null
  slot_duration: number // minutes
}

export interface DoctorLeave {
  id: string
  doctor_id: string
  start_date: string
  end_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface Doctor {
  id: string
  profile_id: string
  employee_number: string
  specialty: string
  sub_specialty: string | null
  license_number: string | null
  consultation_fee: number
  follow_up_fee: number
  bio: string | null
  is_active: boolean
  accepts_online: boolean
  working_hours: WorkingHours[]
  created_at: string
  updated_at: string
  // joined
  profiles?: {
    id: string
    first_name: string
    last_name: string
    display_name: string
    avatar_url: string | null
    phone: string | null
    email: string | null
  }
  leaves?: DoctorLeave[]
  // computed
  _appointment_count?: number
  _today_appointment_count?: number
}

export interface DoctorFilters {
  search?: string
  specialty?: string
  is_active?: boolean
  accepts_online?: boolean
  page?: number
  pageSize?: number
}

export interface DoctorFormData {
  // profile
  first_name: string
  last_name: string
  display_name?: string
  phone?: string
  email: string
  avatar_url?: string
  // doctor
  specialty: string
  sub_specialty?: string
  license_number?: string
  consultation_fee: number
  follow_up_fee: number
  bio?: string
  is_active: boolean
  accepts_online: boolean
  working_hours: WorkingHours[]
}
