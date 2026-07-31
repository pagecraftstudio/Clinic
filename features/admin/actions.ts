'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/admin-context'
import {
  featureFlagSchema,
  announcementSchema,
  maintenanceModeSchema,
  clinicSuspendSchema,
} from '@/lib/validations/admin'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

async function guard(): Promise<ActionResult | null> {
  if (!(await isSuperAdmin())) return { success: false, error: 'Not authorized' }
  return null
}

// ── Clinic lifecycle ────────────────────────────────────────────────────────

export async function suspendClinic(clinicId: string, raw: unknown): Promise<ActionResult> {
  const denied = await guard()
  if (denied) return denied

  const parsed = clinicSuspendSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('clinics')
    .update({ suspended_at: new Date().toISOString(), suspended_reason: parsed.data.reason, is_active: false })
    .eq('id', clinicId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/clinics')
  return { success: true }
}

export async function unsuspendClinic(clinicId: string): Promise<ActionResult> {
  const denied = await guard()
  if (denied) return denied

  const supabase = await createClient()
  const { error } = await supabase
    .from('clinics')
    .update({ suspended_at: null, suspended_reason: null, is_active: true })
    .eq('id', clinicId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/clinics')
  return { success: true }
}

export async function updateClinicInternalNotes(clinicId: string, notes: string): Promise<ActionResult> {
  const denied = await guard()
  if (denied) return denied

  const supabase = await createClient()
  const { error } = await supabase.from('clinics').update({ internal_notes: notes }).eq('id', clinicId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/clinics')
  return { success: true }
}

// ── Feature flags ────────────────────────────────────────────────────────────

export async function upsertFeatureFlag(raw: unknown, id?: string): Promise<ActionResult> {
  const denied = await guard()
  if (denied) return denied

  const parsed = featureFlagSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = id
    ? await supabase.from('feature_flags').update(parsed.data).eq('id', id)
    : await supabase.from('feature_flags').insert({ ...parsed.data, created_by: user?.id ?? null })

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/flags')
  return { success: true }
}

export async function toggleFeatureFlag(id: string, isEnabled: boolean): Promise<ActionResult> {
  const denied = await guard()
  if (denied) return denied

  const supabase = await createClient()
  const { error } = await supabase.from('feature_flags').update({ is_enabled: isEnabled }).eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/flags')
  return { success: true }
}

export async function deleteFeatureFlag(id: string): Promise<ActionResult> {
  const denied = await guard()
  if (denied) return denied

  const supabase = await createClient()
  const { error } = await supabase.from('feature_flags').delete().eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/flags')
  return { success: true }
}

// ── Announcements ────────────────────────────────────────────────────────────

export async function createAnnouncement(raw: unknown): Promise<ActionResult> {
  const denied = await guard()
  if (denied) return denied

  const parsed = announcementSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('system_announcements').insert({ ...parsed.data, created_by: user?.id ?? null })

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/announcements')
  return { success: true }
}

export async function toggleAnnouncement(id: string, isActive: boolean): Promise<ActionResult> {
  const denied = await guard()
  if (denied) return denied

  const supabase = await createClient()
  const { error } = await supabase.from('system_announcements').update({ is_active: isActive }).eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/announcements')
  return { success: true }
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  const denied = await guard()
  if (denied) return denied

  const supabase = await createClient()
  const { error } = await supabase.from('system_announcements').delete().eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/announcements')
  return { success: true }
}

// ── Maintenance mode ─────────────────────────────────────────────────────────

export async function setMaintenanceMode(raw: unknown): Promise<ActionResult> {
  const denied = await guard()
  if (denied) return denied

  const parsed = maintenanceModeSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('platform_settings')
    .update({ value: parsed.data, updated_by: user?.id ?? null, updated_at: new Date().toISOString() })
    .eq('key', 'maintenance_mode')

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/settings')
  revalidatePath('/')
  return { success: true }
}
