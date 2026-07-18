import type { AppointmentStatus, AppointmentType } from './database'

export type { AppointmentStatus, AppointmentType }

export interface Doctor {
  id: string
  specialty: string
  profiles: {
    first_name: string
    last_name: string
    display_name: string
    avatar_url: string | null
  }
}

export interface Appointment {
  id: string
  appointment_number: string
  patient_id: string
  doctor_id: string
  scheduled_at: string
  duration: number
  end_at: string
  type: AppointmentType
  status: AppointmentStatus
  chief_complaint: string | null
  notes: string | null
  checked_in_at: string | null
  checked_out_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  waiting_number: number | null
  is_online: boolean
  online_link: string | null
  booked_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // joined
  patients?: {
    id: string
    full_name: string
    patient_number: string
    phone: string
    gender: string | null
    date_of_birth: string | null
  }
  doctors?: Doctor
}

export interface AppointmentFilters {
  date?: string          // YYYY-MM-DD
  week_start?: string    // YYYY-MM-DD
  month?: string         // YYYY-MM
  doctor_id?: string
  status?: AppointmentStatus
  type?: AppointmentType
  patient_id?: string
  search?: string
  view?: 'day' | 'week' | 'month' | 'agenda'
  page?: number
  pageSize?: number
}

export interface AppointmentFormData {
  patient_id: string
  doctor_id: string
  scheduled_at: string   // ISO datetime-local string
  duration: number
  type: AppointmentType
  chief_complaint?: string
  notes?: string
  is_online?: boolean
  online_link?: string
}
