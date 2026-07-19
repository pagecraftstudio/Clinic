'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  clinicSettingsSchema,
  holidaySchema,
  notificationTemplateSchema,
  createUserSchema,
  updateUserSchema,
} from '@/lib/validations/settings'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

// ── Clinic Settings ───────────────────────────────────────────────────────────

export async function updateClinicSettings(raw: unknown): Promise<ActionResult> {
  const parsed = clinicSettingsSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('clinic_settings')
    .update(parsed.data)
    .not('id', 'is', null)

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

export async function uploadClinicLogo(formData: FormData): Promise<ActionResult<{ logo_url: string }>> {
  const supabase = await createClient()
  const file = formData.get('logo') as File
  if (!file) return { success: false, error: 'No file provided' }

  const ext = file.name.split('.').pop()
  const path = `clinic-logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (uploadError) return { success: false, error: uploadError.message }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('clinic_settings')
    .update({ logo_url: urlData.publicUrl })
    .not('id', 'is', null)

  if (updateError) return { success: false, error: updateError.message }

  revalidatePath('/settings')
  return { success: true, data: { logo_url: urlData.publicUrl } }
}

// ── Holidays ──────────────────────────────────────────────────────────────────

export async function createHoliday(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = holidaySchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('holidays')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings/holidays')
  return { success: true, data: { id: data.id } }
}

export async function updateHoliday(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = holidaySchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('holidays')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings/holidays')
  return { success: true }
}

export async function deleteHoliday(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('holidays').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/settings/holidays')
  return { success: true }
}

// ── Notification Templates ────────────────────────────────────────────────────

export async function createNotificationTemplate(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = notificationTemplateSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notification_templates')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings/notifications')
  return { success: true, data: { id: data.id } }
}

export async function updateNotificationTemplate(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = notificationTemplateSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notification_templates')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings/notifications')
  return { success: true }
}

export async function deleteNotificationTemplate(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('notification_templates').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/settings/notifications')
  return { success: true }
}

export async function toggleNotificationTemplate(id: string, is_active: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notification_templates')
    .update({ is_active })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings/notifications')
  return { success: true }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function createStaffUser(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createUserSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const admin = await createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
    },
  })

  if (authError) return { success: false, error: authError.message }
  if (!authData.user) return { success: false, error: 'User creation failed' }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      role: parsed.data.role,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      phone: parsed.data.phone ?? null,
    })
    .eq('id', authData.user.id)

  if (profileError) return { success: false, error: profileError.message }

  revalidatePath('/settings/users')
  return { success: true, data: { id: authData.user.id } }
}

export async function updateStaffUser(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = updateUserSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update(parsed.data).eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings/users')
  return { success: true }
}

export async function toggleUserActive(id: string, is_active: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/settings/users')
  return { success: true }
}

export async function deleteStaffUser(id: string): Promise<ActionResult> {
  const admin = await createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/settings/users')
  return { success: true }
}

// ── Role Permissions ──────────────────────────────────────────────────────────

export async function updateRolePermissions(
  role: string,
  permissionIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role', role)

  if (deleteError) return { success: false, error: deleteError.message }

  if (permissionIds.length > 0) {
    const rows = permissionIds.map((permission_id) => ({ role, permission_id }))
    const { error: insertError } = await supabase.from('role_permissions').insert(rows)
    if (insertError) return { success: false, error: insertError.message }
  }

  revalidatePath('/settings/roles')
  return { success: true }
}
