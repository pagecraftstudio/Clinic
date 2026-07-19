export type LabTestStatus = 'pending' | 'collected' | 'processing' | 'completed' | 'cancelled'
export type LabTestPriority = 'routine' | 'urgent' | 'stat'

export interface LabTestResult {
  id: string
  lab_request_id: string
  test_name: string
  value: string | null
  unit: string | null
  reference_range: string | null
  is_abnormal: boolean
  notes: string | null
  sort_order: number
}

export interface LabRequest {
  id: string
  request_number: string
  visit_id: string | null
  patient_id: string
  doctor_id: string
  technician_id: string | null
  status: LabTestStatus
  priority: LabTestPriority
  requested_at: string
  collected_at: string | null
  completed_at: string | null
  diagnosis: string | null
  clinical_notes: string | null
  report_notes: string | null
  attachment_url: string | null
  created_at: string
  updated_at: string
  // joined
  patients?: {
    id: string
    full_name: string
    patient_number: string
    phone: string
    date_of_birth: string | null
  } | null
  doctors?: {
    id: string
    specialty: string
    profiles: { display_name: string } | null
  } | null
  technician?: {
    id: string
    profiles: { display_name: string } | null
  } | null
  lab_results?: LabTestResult[]
}

export interface LabTestResultInput {
  test_name: string
  value?: string | null
  unit?: string | null
  reference_range?: string | null
  is_abnormal?: boolean
  notes?: string | null
  sort_order?: number
}

export interface LabRequestInput {
  patient_id: string
  doctor_id: string
  visit_id?: string | null
  priority?: LabTestPriority
  diagnosis?: string | null
  clinical_notes?: string | null
  tests: LabTestResultInput[]
}

export interface LabFilters {
  search?: string
  patient_id?: string
  doctor_id?: string
  status?: LabTestStatus
  priority?: LabTestPriority
  date_from?: string
  date_to?: string
  page?: number
  pageSize?: number
}
