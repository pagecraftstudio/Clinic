import { createClient } from '@/lib/supabase/server'
import type { LabRequest, LabFilters } from '@/types/lab'

const LAB_SELECT = `
  *,
  patients ( id, full_name, patient_number, phone, date_of_birth ),
  doctors ( id, specialty, profiles ( display_name ) ),
  technician:profiles!lab_requests_technician_id_fkey ( id, display_name ),
  lab_results ( * )
`

export async function getLabRequests(filters: LabFilters = {}) {
  const supabase = await createClient()
  const {
    search, patient_id, doctor_id, status, priority,
    date_from, date_to,
    page = 1, pageSize = 50,
  } = filters

  let query = supabase
    .from('lab_requests')
    .select(LAB_SELECT, { count: 'exact' })
    .order('requested_at', { ascending: false })

  if (search) {
    query = query.or(
      `request_number.ilike.%${search}%,patients.full_name.ilike.%${search}%`,
    )
  }
  if (patient_id) query = query.eq('patient_id', patient_id)
  if (doctor_id) query = query.eq('doctor_id', doctor_id)
  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  if (date_from) query = query.gte('requested_at', `${date_from}T00:00:00`)
  if (date_to) query = query.lte('requested_at', `${date_to}T23:59:59`)

  const from = (page - 1) * pageSize
  const { data, error, count } = await query.range(from, from + pageSize - 1)
  if (error) throw error
  return { data: (data ?? []) as LabRequest[], count: count ?? 0 }
}

export async function getLabRequestById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lab_requests')
    .select(LAB_SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as LabRequest
}

export async function getPatientLabRequests(patient_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lab_requests')
    .select(LAB_SELECT)
    .eq('patient_id', patient_id)
    .order('requested_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as LabRequest[]
}
