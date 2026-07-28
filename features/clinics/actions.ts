'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ACTIVE_CLINIC_COOKIE } from '@/lib/clinic-context'
import { z } from 'zod'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

// ── Validation ────────────────────────────────────────────────────────────────

const createClinicSchema = z.object({
  name: z.string().min(2).max(100),
  name_ar: z.string().max(100).optional().nullable(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers, hyphens only'),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  country: z.string().default('EG'),
  currency: z.string().default('EGP'),
  timezone: z.string().default('Africa/Cairo'),
})

const updateClinicSchema = createClinicSchema.partial().extend({ id: z.string().uuid() })

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'doctor', 'receptionist', 'nurse', 'cashier', 'accountant',
    'lab_technician', 'radiology_technician', 'pharmacist', 'marketing']),
})

// ── Clinic CRUD ───────────────────────────────────────────────────────────────

export async function createClinic(raw: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = createClinicSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthenticated' }

  const { data: clinic, error } = await supabase
    .from('clinics')
    .insert({ ...parsed.data, owner_id: user.id })
    .select('id, slug')
    .single()

  if (error) return { success: false, error: error.message }

  // Enroll creator as owner
  await supabase.from('clinic_users').insert({
    clinic_id: clinic.id,
    user_id: user.id,
    role: 'owner',
  })

  revalidatePath('/settings/clinic')
  return { success: true, data: { id: clinic.id, slug: clinic.slug } }
}

export async function updateClinic(raw: unknown): Promise<ActionResult> {
  const parsed = updateClinicSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const { id, ...rest } = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from('clinics').update(rest).eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/settings/clinic')
  return { success: true }
}

export async function uploadClinicLogo(clinicId: string, formData: FormData): Promise<ActionResult<{ logo_url: string }>> {
  const supabase = await createClient()
  const file = formData.get('logo') as File
  if (!file) return { success: false, error: 'No file provided' }

  const ext = file.name.split('.').pop()
  const path = `clinic-logos/${clinicId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (uploadError) return { success: false, error: uploadError.message }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)

  await supabase.from('clinics').update({ logo_url: urlData.publicUrl }).eq('id', clinicId)
  revalidatePath('/settings/clinic')
  return { success: true, data: { logo_url: urlData.publicUrl } }
}

// ── Clinic Switching ──────────────────────────────────────────────────────────

export async function switchClinic(clinicId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthenticated' }

  // Verify membership
  const { data: membership } = await supabase
    .from('clinic_users')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) return { success: false, error: 'Not a member of this clinic' }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_CLINIC_COOKIE, clinicId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  revalidatePath('/', 'layout')
  return { success: true }
}

// ── Invitations ───────────────────────────────────────────────────────────────

export async function inviteUser(clinicId: string, raw: unknown): Promise<ActionResult<{ token: string }>> {
  const parsed = inviteSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthenticated' }

  const { data, error } = await supabase
    .from('clinic_invitations')
    .insert({ clinic_id: clinicId, ...parsed.data, invited_by: user.id })
    .select('token')
    .single()

  if (error) return { success: false, error: error.message }

  // TODO: send invitation email via notification system (Phase 3)

  revalidatePath('/settings/users')
  return { success: true, data: { token: data.token } }
}

export async function acceptInvitation(token: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Please log in first' }

  const { data: inv } = await supabase
    .from('clinic_invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!inv) return { success: false, error: 'Invitation not found or expired' }

  const adminSupabase = await createAdminClient()

  // Add to clinic_users
  const { error } = await adminSupabase.from('clinic_users').insert({
    clinic_id: inv.clinic_id,
    user_id: user.id,
    role: inv.role,
    invited_by: inv.invited_by,
  })

  if (error && !error.message.includes('duplicate')) {
    return { success: false, error: error.message }
  }

  // Mark invitation accepted
  await adminSupabase.from('clinic_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', inv.id)

  // Auto-switch to new clinic
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_CLINIC_COOKIE, inv.clinic_id, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  })

  return { success: true }
}

export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clinic_invitations')
    .delete()
    .eq('id', invitationId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/settings/users')
  return { success: true }
}

export async function removeClinicUser(clinicId: string, userId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clinic_users')
    .update({ is_active: false })
    .eq('clinic_id', clinicId)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/settings/users')
  return { success: true }
}

export async function updateClinicUserRole(
  clinicId: string, userId: string, role: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clinic_users')
    .update({ role })
    .eq('clinic_id', clinicId)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/settings/users')
  return { success: true }
}
