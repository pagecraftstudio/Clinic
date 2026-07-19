import { createClient } from '@/lib/supabase/server'
import type { Prescription, PrescriptionFilters } from '@/types/prescription'

const PRESCRIPTION_SELECT = `
  *,
  patients ( id, full_name, patient_number, phone, date_of_birth ),
  doctors ( id, specialty, profiles ( display_name ) ),
  prescription_items ( * )
`

export async function getPrescriptions(filters: PrescriptionFilters = {}) {
  const supabase = await createClient()
  const {
    search, patient_id, doctor_id, is_dispensed,
    date_from, date_to,
    page = 1, pageSize = 50,
  } = filters

  let query = supabase
    .from('prescriptions')
    .select(PRESCRIPTION_SELECT, { count: 'exact' })
    .order('prescribed_at', { ascending: false })

  if (search) {
    query = query.or(
      `prescription_number.ilike.%${search}%,patients.full_name.ilike.%${search}%`,
    )
  }
  if (patient_id) query = query.eq('patient_id', patient_id)
  if (doctor_id) query = query.eq('doctor_id', doctor_id)
  if (typeof is_dispensed === 'boolean') query = query.eq('is_dispensed', is_dispensed)
  if (date_from) query = query.gte('prescribed_at', `${date_from}T00:00:00`)
  if (date_to) query = query.lte('prescribed_at', `${date_to}T23:59:59`)

  const from = (page - 1) * pageSize
  const { data, error, count } = await query.range(from, from + pageSize - 1)
  if (error) throw error
  return { data: (data ?? []) as Prescription[], count: count ?? 0 }
}

export async function getPrescriptionById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prescriptions')
    .select(PRESCRIPTION_SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Prescription
}

export async function getPatientPrescriptions(patient_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prescriptions')
    .select(PRESCRIPTION_SELECT)
    .eq('patient_id', patient_id)
    .order('prescribed_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Prescription[]
}
