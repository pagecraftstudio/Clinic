import type { UserRole } from './database'

export interface Clinic {
  id: string
  slug: string
  name: string
  name_ar: string | null
  logo_url: string | null
  tagline: string | null
  tagline_ar: string | null
  phone: string | null
  phone_alt: string | null
  email: string | null
  address: string | null
  address_ar: string | null
  city: string | null
  country: string
  tax_number: string | null
  license_number: string | null
  currency: string
  timezone: string
  date_format: string
  time_format: string
  working_days: number[]
  working_hours_start: string
  working_hours_end: string
  appointment_duration: number
  primary_color: string
  theme: string
  invoice_prefix: string
  invoice_notes: string | null
  invoice_footer: string | null
  is_active: boolean
  owner_id: string | null
  created_at: string
  updated_at: string
}

export interface ClinicUser {
  id: string
  clinic_id: string
  user_id: string
  role: UserRole
  is_active: boolean
  invited_by: string | null
  joined_at: string
  created_at: string
  clinics?: Pick<Clinic, 'id' | 'slug' | 'name' | 'logo_url'>
}

export interface ClinicInvitation {
  id: string
  clinic_id: string
  email: string
  role: UserRole
  token: string
  invited_by: string | null
  accepted_at: string | null
  expires_at: string
  created_at: string
  clinics?: Pick<Clinic, 'id' | 'name' | 'logo_url'>
}

export interface ClinicMembership {
  clinic: Pick<Clinic, 'id' | 'slug' | 'name' | 'logo_url'>
  role: UserRole
  is_active: boolean
}
