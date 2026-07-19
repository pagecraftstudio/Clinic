import type { Database } from '@/types/database'

export type Patient = Database['public']['Tables']['patients']['Row']
export type PatientInsert = Omit<
  Database['public']['Tables']['patients']['Insert'],
  'id' | 'referred_by' | 'created_by' | 'profile_id' | 'is_active' | 'deleted_at'
> & {
  referred_by?: string | null
}
export type PatientUpdate = Partial<PatientInsert>

export interface EmergencyContact {
  id: string
  patient_id: string
  name: string
  relation: string
  phone: string
  phone_alt: string | null
  is_primary: boolean
  created_at: string
}

export type EmergencyContactInput = Omit<EmergencyContact, 'id' | 'patient_id' | 'created_at'>

export type PatientDocumentType =
  | 'national_id' | 'passport' | 'insurance_card' | 'lab_report'
  | 'radiology_report' | 'prescription' | 'referral' | 'consent_form' | 'other'

export interface PatientDocument {
  id: string
  patient_id: string
  type: PatientDocumentType
  name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  notes: string | null
  uploaded_by: string | null
  created_at: string
}

export interface PatientListItem extends Patient {
  last_visit_at?: string | null
  upcoming_appointment_at?: string | null
  total_visits?: number
  outstanding_balance?: number
}

export interface PatientTimelineEvent {
  id: string
  type: 'visit' | 'appointment' | 'prescription' | 'invoice' | 'lab_order' | 'radiology_order' | 'document'
  title: string
  subtitle?: string | null
  occurred_at: string
  status?: string | null
  href?: string
}

export interface PatientFilters {
  search?: string
  gender?: Patient['gender']
  blood_group?: Patient['blood_group']
  is_active?: boolean
  governorate?: string
  page?: number
  pageSize?: number
  sortBy?: 'created_at' | 'full_name' | 'date_of_birth'
  sortDir?: 'asc' | 'desc'
}
