import { createClient } from '@/lib/supabase/server'
import type { AdminClinicRow, FeatureFlag, SystemAnnouncement, MaintenanceModeValue, PlatformStats } from '@/types/admin'

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createClient()
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [clinics, users, patients, appts30d, invoices30d] = await Promise.all([
    supabase.from('clinics').select('is_active, suspended_at', { count: 'exact' }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'patient'),
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('created_at', since30d),
    supabase.from('invoices').select('total, status').gte('created_at', since30d),
  ])

  const clinicRows = clinics.data ?? []
  const revenue30d = (invoices30d.data ?? [])
    .filter((i) => i.status === 'paid' || i.status === 'partial')
    .reduce((sum, i) => sum + (i.total ?? 0), 0)

  return {
    clinic_count: clinics.count ?? clinicRows.length,
    active_clinic_count: clinicRows.filter((c) => c.is_active && !c.suspended_at).length,
    suspended_clinic_count: clinicRows.filter((c) => !!c.suspended_at).length,
    user_count: users.count ?? 0,
    patient_count: patients.count ?? 0,
    appointment_count_30d: appts30d.count ?? 0,
    revenue_30d: revenue30d,
  }
}

export async function getAdminClinics(): Promise<AdminClinicRow[]> {
  const supabase = await createClient()

  const { data: clinics, error } = await supabase
    .from('clinics')
    .select('id, slug, name, logo_url, city, country, is_active, suspended_at, suspended_reason, internal_notes, created_at, owner_id')
    .order('created_at', { ascending: false })

  if (error || !clinics) return []

  const clinicIds = clinics.map((c) => c.id)
  const ownerIds = clinics.map((c) => c.owner_id).filter(Boolean) as string[]

  const [userCounts, patientCounts, owners] = await Promise.all([
    supabase.from('clinic_users').select('clinic_id').in('clinic_id', clinicIds),
    supabase.from('patients').select('clinic_id').in('clinic_id', clinicIds),
    ownerIds.length
      ? supabase.from('profiles').select('id, email').in('id', ownerIds)
      : Promise.resolve({ data: [] as { id: string; email: string }[] }),
  ])

  const countBy = (rows: { clinic_id: string | null }[] | null) => {
    const map = new Map<string, number>()
    for (const r of rows ?? []) {
      if (!r.clinic_id) continue
      map.set(r.clinic_id, (map.get(r.clinic_id) ?? 0) + 1)
    }
    return map
  }

  const userCountMap = countBy(userCounts.data)
  const patientCountMap = countBy(patientCounts.data)
  const ownerEmailMap = new Map((owners.data ?? []).map((o) => [o.id, o.email]))

  return clinics.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    logo_url: c.logo_url,
    city: c.city,
    country: c.country,
    is_active: c.is_active,
    suspended_at: c.suspended_at,
    suspended_reason: c.suspended_reason,
    internal_notes: c.internal_notes,
    created_at: c.created_at,
    user_count: userCountMap.get(c.id) ?? 0,
    patient_count: patientCountMap.get(c.id) ?? 0,
    owner_email: c.owner_id ? ownerEmailMap.get(c.owner_id) ?? null : null,
  }))
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getAnnouncements(): Promise<SystemAnnouncement[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('system_announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getMaintenanceMode(): Promise<MaintenanceModeValue> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()

  return (data?.value as MaintenanceModeValue) ?? { enabled: false, message: '' }
}

export async function getRecentAuditLogs(limit = 50) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, profiles(display_name, email)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return data ?? []
}
