// ============================================================
// EMR Types
// ============================================================
// Kept in sync with the actual `visits` / `vitals` / `soap_notes`
// columns in supabase/migrations. Some previously-modeled fields
// (visit_type, soft-delete on visits, e-signing on SOAP notes,
// structured follow-up) don't exist in the current schema and
// were removed here rather than silently faked in the app layer.
// Add a migration + re-add these fields if you want that
// functionality back.

export type VisitStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface ICD10Code {
  code: string
  description: string
  type: 'primary' | 'secondary'
}

export interface Visit {
  id: string
  visit_number: string
  patient_id: string
  doctor_id: string
  appointment_id: string | null
  visit_date: string
  chief_complaint: string | null
  status: VisitStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  patient?: { id: string; full_name: string; national_id: string | null }
  doctor?: { id: string; specialty: string | null; profiles: { display_name: string } | null }
  vitals?: Vitals | null
  soap_note?: SOAPNote | null
}

export interface Vitals {
  id: string
  visit_id: string
  patient_id: string
  recorded_by: string | null
  height: number | null
  weight: number | null
  bmi: number | null
  temperature: number | null
  pulse: number | null
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  oxygen_saturation: number | null
  respiratory_rate: number | null
  notes: string | null
  created_at: string
}

export interface SOAPNote {
  id: string
  visit_id: string
  patient_id: string
  doctor_id: string
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
  diagnosis_codes: string[] | null
  created_at: string
  updated_at: string
}

export interface CreateVisitInput {
  patient_id: string
  doctor_id: string
  appointment_id?: string | null
  visit_date: string
  chief_complaint?: string | null
  notes?: string | null
  created_by?: string | null
}

export interface UpsertVitalsInput {
  visit_id: string
  patient_id: string
  height?: number | null
  weight?: number | null
  bmi?: number | null
  temperature?: number | null
  pulse?: number | null
  blood_pressure_systolic?: number | null
  blood_pressure_diastolic?: number | null
  oxygen_saturation?: number | null
  respiratory_rate?: number | null
  notes?: string | null
}

export interface UpsertSOAPInput {
  visit_id: string
  patient_id: string
  subjective?: string | null
  objective?: string | null
  assessment?: string | null
  plan?: string | null
  diagnosis_codes?: string[] | null
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
  date_from?: string
  date_to?: string
  search?: string
}
