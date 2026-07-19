export type RadiologyStatus = 'requested' | 'scheduled' | 'completed' | 'cancelled'

export interface RadiologyType {
  id: string
  name: string
  name_ar: string | null
  price: number | null
  is_active: boolean
}

export interface RadiologyAttachment {
  id: string
  order_id: string
  name: string
  file_url: string
  mime_type: string | null
  is_dicom: boolean
  uploaded_by: string | null
  created_at: string
}

export interface RadiologyOrder {
  id: string
  order_number: string
  patient_id: string
  doctor_id: string
  visit_id: string | null
  type_id: string
  body_part: string | null
  clinical_info: string | null
  status: RadiologyStatus
  requested_at: string
  scheduled_at: string | null
  completed_at: string | null
  findings: string | null
  impression: string | null
  technician_id: string | null
  radiologist_id: string | null
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
  radiology_types?: RadiologyType | null
  radiology_attachments?: RadiologyAttachment[]
}

export interface RadiologyOrderInput {
  patient_id: string
  doctor_id: string
  visit_id?: string | null
  type_id: string
  body_part?: string | null
  clinical_info?: string | null
  scheduled_at?: string | null
}

export interface RadiologyReportInput {
  findings?: string | null
  impression?: string | null
  scheduled_at?: string | null
}

export interface RadiologyFilters {
  search?: string
  patient_id?: string
  doctor_id?: string
  type_id?: string
  status?: RadiologyStatus
  date_from?: string
  date_to?: string
  page?: number
  pageSize?: number
}
