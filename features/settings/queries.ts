import { createClient } from '@/lib/supabase/server'

export async function getClinicSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinic_settings')
    .select('*')
    .limit(1)
    .single()

  if (error) return null
  return data
}

export async function getHolidays() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .order('date', { ascending: true })

  if (error) return []
  return data ?? []
}

export async function getNotificationTemplates() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .order('channel', { ascending: true })

  if (error) return []
  return data ?? []
}

export async function getStaffUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .not('role', 'eq', 'patient')
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getPermissions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('module', { ascending: true })

  if (error) return []
  return data ?? []
}

export async function getRolePermissions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('role_permissions')
    .select('*, permissions(*)')

  if (error) return []
  return data ?? []
}
