export type PrescriptionStatus = 'active' | 'dispensed' | 'expired' | 'cancelled'

export interface PrescriptionItem {
  id: string
  prescription_id: string
  medicine_name: string
  strength: string | null
  form: string | null
  dosage: string
  frequency: string
  duration: string
  quantity: number | null
  route: string | null
  instructions: string | null
  is_prn: boolean
  sort_order: number
}

export interface Prescription {
  id: string
  prescription_number: string
  visit_id: string | null
  patient_id: string
  doctor_id: string
  prescribed_at: string
  valid_until: string | null
  diagnosis: string | null
  notes: string | null
  is_dispensed: boolean
  dispensed_at: string | null
  dispensed_by: string | null
  pdf_url: string | null
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
  prescription_items?: PrescriptionItem[]
}

export interface PrescriptionItemInput {
  medicine_name: string
  strength?: string | null
  form?: string | null
  dosage: string
  frequency: string
  duration: string
  quantity?: number | null
  route?: string | null
  instructions?: string | null
  is_prn?: boolean
  sort_order?: number
}

export interface PrescriptionInput {
  patient_id: string
  doctor_id: string
  visit_id?: string | null
  valid_until?: string | null
  diagnosis?: string | null
  notes?: string | null
  items: PrescriptionItemInput[]
}

export interface PrescriptionFilters {
  search?: string
  patient_id?: string
  doctor_id?: string
  is_dispensed?: boolean
  date_from?: string
  date_to?: string
  page?: number
  pageSize?: number
}
