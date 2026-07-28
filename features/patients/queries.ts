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
