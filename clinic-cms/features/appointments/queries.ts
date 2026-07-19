import { createClient } from '@/lib/supabase/server'
import type { Appointment, AppointmentFilters } from '@/types/appointment'

const APPOINTMENT_SELECT = `
  *,
  patients ( id, full_name, patient_number, phone, gender, date_of_birth ),
  doctors ( id, specialty, profiles ( first_name, last_name, display_name, avatar_url ) )
`

export async function getAppointments(filters: AppointmentFilters = {}) {
  const supabase = await createClient()

  const {
    date, week_start, month, doctor_id, status, type,
    patient_id, page = 1, pageSize = 50,
  } = filters

  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true })

  if (date) {
    const start = `${date}T00:00:00`
    const end   = `${date}T23:59:59`
    query = query.gte('scheduled_at', start).lte('scheduled_at', end)
  } else if (week_start) {
    const start = new Date(week_start)
    const end   = new Date(week_start)
    end.setDate(end.getDate() + 6)
    query = query
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', `${end.toISOString().slice(0, 10)}T23:59:59`)
  } else if (month) {
    const [y, m] = month.split('-').map(Number)
    const start  = new Date(y, m - 1, 1)
    const endDay = new Date(y, m, 0)
    query = query
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', `${endDay.toISOString().slice(0, 10)}T23:59:59`)
  }

  if (doctor_id)  query = query.eq('doctor_id', doctor_id)
  if (status)     query = query.eq('status', status)
  if (type)       query = query.eq('type', type)
  if (patient_id) query = query.eq('patient_id', patient_id)

  const from = (page - 1) * pageSize
  const { data, error, count } = await query.range(from, from + pageSize - 1)

  if (error) throw error
  return { data: (data ?? []) as Appointment[], count: count ?? 0 }
}

export async function getAppointmentById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data as Appointment
}

export async function getDoctors() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('doctors')
    .select('id, specialty, profiles ( first_name, last_name, display_name, avatar_url )')
    .eq('is_active', true)
    .order('specialty')

  if (error) throw error
  return data ?? []
}
