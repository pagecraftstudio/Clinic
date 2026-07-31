import { createClient } from '@/lib/supabase/server'
import { requireActiveClinicId } from '@/lib/clinic-context'
import type { Patient, PatientFilters, PatientTimelineEvent } from '@/types/patient'

const PAGE_SIZE_DEFAULT = 20

export async function getPatients(filters: PatientFilters = {}) {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const {
    search, gender, blood_group, is_active = true, governorate,
    page = 1, pageSize = PAGE_SIZE_DEFAULT,
    sortBy = 'created_at', sortDir = 'desc',
  } = filters

  let query = supabase
    .from('patients')
    .select('*', { count: 'exact' })
    .eq('clinic_id', clinicId)
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
  const { data, error, count } = await query
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range(from, from + pageSize - 1)

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
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('clinic_id', clinicId)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(error.message)
  return data as Patient
}

export async function getPatientEmergencyContacts(patientId: string) {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { data, error } = await supabase
    .from('patient_emergency_contacts')
    .select('*')
    .eq('patient_id', patientId)
    .order('is_primary', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPatientDocuments(patientId: string) {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { data, error } = await supabase
    .from('patient_documents')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPatientTimeline(patientId: string): Promise<PatientTimelineEvent[]> {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const [appts, visits, prescriptions, invoices] = await Promise.all([
    supabase.from('appointments').select('id, scheduled_at, status, type').eq('patient_id', patientId).eq('clinic_id', clinicId).is('deleted_at', null).order('scheduled_at', { ascending: false }).limit(20),
    supabase.from('visits').select('id, created_at, chief_complaint').eq('patient_id', patientId).eq('clinic_id', clinicId).order('created_at', { ascending: false }).limit(20),
    supabase.from('prescriptions').select('id, created_at, status').eq('patient_id', patientId).eq('clinic_id', clinicId).order('created_at', { ascending: false }).limit(10),
    supabase.from('invoices').select('id, created_at, status, total_amount').eq('patient_id', patientId).eq('clinic_id', clinicId).order('created_at', { ascending: false }).limit(10),
  ])

  const events: PatientTimelineEvent[] = [
    ...(appts.data ?? []).map(a => ({ id: a.id, type: 'appointment' as const, title: `Appointment (${a.type})`, occurred_at: a.scheduled_at, status: a.status, href: `/appointments/${a.id}` })),
    ...(visits.data ?? []).map(v => ({ id: v.id, type: 'visit' as const, title: 'Visit', subtitle: v.chief_complaint, occurred_at: v.created_at, href: `/visits/${v.id}` })),
    ...(prescriptions.data ?? []).map(p => ({ id: p.id, type: 'prescription' as const, title: 'Prescription', occurred_at: p.created_at, status: p.status, href: `/prescriptions/${p.id}` })),
    ...(invoices.data ?? []).map(i => ({ id: i.id, type: 'invoice' as const, title: `Invoice`, subtitle: `${i.total_amount}`, occurred_at: i.created_at, status: i.status, href: `/billing/${i.id}` })),
  ]

  return events.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
}
