import { createClient } from '@/lib/supabase/server'
import type { Clinic, ClinicUser, ClinicInvitation } from '@/types/clinic'

export async function getClinicById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data as Clinic
}

export async function getClinicBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw new Error(error.message)
  return data as Clinic
}

export async function getClinicUsers(clinicId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinic_users')
    .select('*, profiles(id, first_name, last_name, display_name, email, avatar_url, role, is_active)')
    .eq('clinic_id', clinicId)
    .order('joined_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as ClinicUser[]
}

export async function getClinicInvitations(clinicId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinic_invitations')
    .select('*')
    .eq('clinic_id', clinicId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ClinicInvitation[]
}

export async function getInvitationByToken(token: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinic_invitations')
    .select('*, clinics(id, name, logo_url)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()
  if (error) return null
  return data as ClinicInvitation & { clinics: { id: string; name: string; logo_url: string | null } }
}
