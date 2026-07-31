import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns true if the current user is a platform super admin.
 * Platform-level, not clinic-scoped (profiles.is_super_admin).
 */
export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  return data?.is_super_admin === true
}

/**
 * Use at the top of any /admin server component or server action.
 * Redirects non-admins straight back to the main dashboard.
 */
export async function requireSuperAdmin(): Promise<void> {
  const ok = await isSuperAdmin()
  if (!ok) redirect('/')
}
