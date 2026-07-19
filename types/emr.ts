// ============================================================
// EMR Types
// ============================================================

export type VisitType = 'outpatient' | 'follow_up' | 'emergency' | 'teleconsult'
export type VisitStatus = 'open' | 'completed' | 'cancelled'

export interface ICD10Code {
  code: string
  description: string
  type: 'primary' | 'secondary'
}

export interface Visit {
  id: string
  patient_id: string
  doctor_id: string
  appointment_id: string | null
  visit_date: string
  visit_type: VisitType
  chief_complaint: string | null
  status: VisitStatus
  deleted_at: string | null
  created_at: string
  updated_at: string
  patient?: { id: string; full_name: string; national_id: string | null; avatar_url: string | null }
  doctor?: { id: string; full_name: string; specialty: string | null; avatar_url: string | null }
  vitals?: Vitals | null
  soap_note?: SOAPNote | null
}

export interface Vitals {
  id: string
  visit_id: string
  recorded_by: string
  recorded_at: string
  weight_kg: number | null
  height_cm: number | null
  bmi: number | null
  temperature_c: number | null
  systolic_bp: number | null
  diastolic_bp: number | null
  pulse_bpm: number | null
  spo2_pct: number | null
  respiratory_rate: number | null
  blood_glucose_mgdl: number | null
  notes: string | null
  created_at: string
}

export interface SOAPNote {
  id: string
  visit_id: string
  doctor_id: string
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
  diagnoses: ICD10Code[]
  follow_up_date: string | null
  follow_up_notes: string | null
  signed_at: string | null
  signed_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateVisitInput {
  patient_id: string
  doctor_id: string
  appointment_id?: string
  visit_date: string
  visit_type: VisitType
  chief_complaint: string
}

export interface UpsertVitalsInput {
  visit_id: string
  weight_kg?: number | null
  height_cm?: number | null
  temperature_c?: number | null
  systolic_bp?: number | null
  diastolic_bp?: number | null
  pulse_bpm?: number | null
  spo2_pct?: number | null
  respiratory_rate?: number | null
  blood_glucose_mgdl?: number | null
  notes?: string | null
}

export interface UpsertSOAPInput {
  visit_id: string
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  diagnoses?: ICD10Code[]
  follow_up_date?: string | null
  follow_up_notes?: string | null
}

export interface PaginatedVisits {
  data: Visit[]
  count: number
  page: number
  per_page: number
}

export interface VisitFilters {
  patient_id?: string
  doctor_id?: string
  status?: VisitStatus
  visit_type?: VisitType
  date_from?: string
  date_to?: string
  search?: string
}
