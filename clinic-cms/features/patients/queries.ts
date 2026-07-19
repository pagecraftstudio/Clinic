import { createClient } from '@/lib/supabase/server'
import type { Patient, PatientFilters, PatientTimelineEvent } from '@/types/patient'

const PAGE_SIZE_DEFAULT = 20

export async function getPatients(filters: PatientFilters = {}) {
  const supabase = await createClient()
  const {
    search, gender, blood_group, is_active = true, governorate,
    page = 1, pageSize = PAGE_SIZE_DEFAULT,
    sortBy = 'created_at', sortDir = 'desc',
  } = filters

  let query = supabase
    .from('patients')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .eq('is_active', is_active)

  if (search) {
    const term = search.trim()
    query = query.or(
      `full_name.ilike.%${term}%,phone.ilike.%${term}%,national_id.ilike.%${term}%,patient_number.ilike.%${term}%`
    )
  }
  if (gender) query = query.eq('gender', gender)
  if (blood_group) query = query.eq('blood_group', blood_group)
  if (governorate) query = query.eq('governorate', governorate)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    patients: (data ?? []) as Patient[],
    total: count ?? 0,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  }
}

export async function getPatientById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(error.message)
  return data as Patient
}

export async function getPatientEmergencyContacts(patientId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patient_emergency_contacts')
    .select('*')
    .eq('patient_id', patientId)
    .order('is_primary', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getPatientDocuments(patientId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patient_documents')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// Aggregated activity feed pulled from visits, appointments, prescriptions,
// invoices, lab & radiology orders — sorted newest first.
export async function getPatientTimeline(patientId: string): Promise<PatientTimelineEvent[]> {
  const supabase = await createClient()

  const [visits, appointments, prescriptions, invoices, labOrders, radiologyOrders] = await Promise.all([
    supabase.from('visits').select('id, visit_date, chief_complaint, status').eq('patient_id', patientId),
    supabase.from('appointments').select('id, scheduled_at, type, status').eq('patient_id', patientId),
    supabase.from('prescriptions').select('id, created_at, status').eq('patient_id', patientId),
    supabase.from('invoices').select('id, created_at, status, total').eq('patient_id', patientId),
    supabase.from('lab_orders').select('id, created_at, status').eq('patient_id', patientId),
    supabase.from('radiology_orders').select('id, created_at, status').eq('patient_id', patientId),
  ])

  const events: PatientTimelineEvent[] = []

  visits.data?.forEach((v) => events.push({
    id: `visit-${v.id}`, type: 'visit', title: 'Visit',
    subtitle: v.chief_complaint, occurred_at: v.visit_date, status: v.status,
    href: `/patients/${patientId}/emr`,
  }))
  appointments.data?.forEach((a) => events.push({
    id: `appt-${a.id}`, type: 'appointment', title: `Appointment (${a.type})`,
    occurred_at: a.scheduled_at, status: a.status,
    href: `/appointments/${a.id}`,
  }))
  prescriptions.data?.forEach((p) => events.push({
    id: `rx-${p.id}`, type: 'prescription', title: 'Prescription issued',
    occurred_at: p.created_at, status: p.status,
    href: `/patients/${patientId}/prescriptions`,
  }))
  invoices.data?.forEach((i) => events.push({
    id: `inv-${i.id}`, type: 'invoice', title: 'Invoice',
    subtitle: `${i.total} EGP`, occurred_at: i.created_at, status: i.status,
    href: `/patients/${patientId}/billing`,
  }))
  labOrders.data?.forEach((l) => events.push({
    id: `lab-${l.id}`, type: 'lab_order', title: 'Lab order',
    occurred_at: l.created_at, status: l.status,
    href: `/patients/${patientId}/lab`,
  }))
  radiologyOrders.data?.forEach((r) => events.push({
    id: `rad-${r.id}`, type: 'radiology_order', title: 'Radiology order',
    occurred_at: r.created_at, status: r.status,
    href: `/patients/${patientId}/radiology`,
  }))

  return events.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
}

export async function searchPatients(term: string, limit = 8) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select('id, patient_number, full_name, phone, date_of_birth, gender')
    .is('deleted_at', null)
    .or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,patient_number.ilike.%${term}%,national_id.ilike.%${term}%`)
    .limit(limit)

  if (error) throw new Error(error.message)
  return data
}
