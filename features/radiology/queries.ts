import { createClient } from '@/lib/supabase/server'
import type { RadiologyOrder, RadiologyFilters } from '@/types/radiology'

const RADIO_SELECT = `
  *,
  patients ( id, full_name, patient_number, phone, date_of_birth ),
  doctors ( id, specialty, profiles ( display_name ) ),
  radiology_types ( id, name, name_ar, price ),
  radiology_attachments ( * )
`

export async function getRadiologyOrders(filters: RadiologyFilters = {}) {
  const supabase = await createClient()
  const {
    search, patient_id, doctor_id, type_id, status,
    date_from, date_to,
    page = 1, pageSize = 50,
  } = filters

  let query = supabase
    .from('radiology_orders')
    .select(RADIO_SELECT, { count: 'exact' })
    .order('requested_at', { ascending: false })

  if (patient_id) query = query.eq('patient_id', patient_id)
  if (doctor_id) query = query.eq('doctor_id', doctor_id)
  if (type_id) query = query.eq('type_id', type_id)
  if (status) query = query.eq('status', status)
  if (date_from) query = query.gte('requested_at', `${date_from}T00:00:00`)
  if (date_to) query = query.lte('requested_at', `${date_to}T23:59:59`)
  if (search) query = query.ilike('order_number', `%${search}%`)

  const from = (page - 1) * pageSize
  const { data, error, count } = await query.range(from, from + pageSize - 1)
  if (error) throw error
  return { data: (data ?? []) as RadiologyOrder[], count: count ?? 0 }
}

export async function getRadiologyOrderById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('radiology_orders')
    .select(RADIO_SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as RadiologyOrder
}

export async function getRadiologyTypes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('radiology_types')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getPatientRadiologyOrders(patient_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('radiology_orders')
    .select(RADIO_SELECT)
    .eq('patient_id', patient_id)
    .order('requested_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as RadiologyOrder[]
}
