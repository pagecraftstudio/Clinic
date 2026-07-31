export interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string | null
  is_enabled: boolean
  rollout_percent: number
  clinic_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type AnnouncementSeverity = 'info' | 'warning' | 'critical'

export interface SystemAnnouncement {
  id: string
  title: string
  message: string
  severity: AnnouncementSeverity
  is_active: boolean
  starts_at: string
  ends_at: string | null
  created_by: string | null
  created_at: string
}

export interface MaintenanceModeValue {
  enabled: boolean
  message: string
}

export interface AdminClinicRow {
  id: string
  slug: string
  name: string
  logo_url: string | null
  city: string | null
  country: string
  is_active: boolean
  suspended_at: string | null
  suspended_reason: string | null
  internal_notes: string | null
  created_at: string
  user_count: number
  patient_count: number
  owner_email: string | null
}

export interface PlatformStats {
  clinic_count: number
  active_clinic_count: number
  suspended_clinic_count: number
  user_count: number
  patient_count: number
  appointment_count_30d: number
  revenue_30d: number
}
