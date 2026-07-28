/**
 * Server-side helpers to read / set the active clinic for the current user.
 * The active clinic ID is stored in a cookie ("active_clinic_id").
 * All queries use this to scope data. The Supabase RLS function
 * get_active_clinic_id() reads from clinic_users based on auth.uid(),
 * but for multi-clinic users we also pass clinic_id explicitly in queries.
 */

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export const ACTIVE_CLINIC_COOKIE = 'active_clinic_id'

/**
 * Returns the active clinic_id for the current user.
 * 1. Cookie value (if the user has explicitly switched)
 * 2. First clinic membership (alphabetically by clinic name)
 */
export async function getActiveClinicId(): Promise<string | null> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(ACTIVE_CLINIC_COOKIE)?.value

  if (fromCookie) return fromCookie

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('clinic_users')
    .select('clinic_id, clinics(name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single()

  return data?.clinic_id ?? null
}

/**
 * Returns the active clinic_id or throws.
 * Use in server actions / queries that require a clinic scope.
 */
export async function requireActiveClinicId(): Promise<string> {
  const id = await getActiveClinicId()
  if (!id) throw new Error('No active clinic. Please select a clinic.')
  return id
}

/**
 * Returns all clinic memberships for the current user.
 */
export async function getUserClinics() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('clinic_users')
    .select('role, is_active, clinics(id, slug, name, name_ar, logo_url)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })

  return (data ?? []) as Array<{
    role: string
    is_active: boolean
    clinics: { id: string; slug: string; name: string; name_ar: string | null; logo_url: string | null }
  }>
}
