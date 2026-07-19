import { createClient } from '@/lib/supabase/server'
import type { Doctor, DoctorFilters } from '@/types/doctor'

const DOCTOR_SELECT = `
  *,
  profiles ( id, first_name, last_name, display_name, avatar_url, phone, email )
`

export async function getDoctors(filters: DoctorFilters = {}) {
  const supabase = await createClient()
  const { search, specialty, is_active, accepts_online, page = 1, pageSize = 20 } = filters

  let query = supabase
    .from('doctors')
    .select(DOCTOR_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (typeof is_active === 'boolean') query = query.eq('is_active', is_active)
  if (typeof accepts_online === 'boolean') query = query.eq('accepts_online', accepts_online)
  if (specialty) query = query.eq('specialty', specialty)
  if (search) {
    query = query.or(
      `specialty.ilike.%${search}%,license_number.ilike.%${search}%,employee_number.ilike.%${search}%`
    )
  }

  const from = (page - 1) * pageSize
  const { data, error, count } = await query.range(from, from + pageSize - 1)

  if (error) throw error
  return { data: (data ?? []) as Doctor[], count: count ?? 0 }
}

export async function getDoctorById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('doctors')
    .select(`${DOCTOR_SELECT}, leaves:doctor_leaves(*)`)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Doctor
}

export async function getSpecialties() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('doctors')
    .select('specialty')
    .eq('is_active', true)
    .order('specialty')

  if (error) throw error
  const unique = [...new Set((data ?? []).map((d) => d.specialty).filter(Boolean))]
  return unique as string[]
}
