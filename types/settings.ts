import type { UserRole } from './database'

export interface ClinicSettings {
  id: string
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
  created_at: string
  updated_at: string
}

export interface ClinicSettingsInput {
  name: string
  name_ar?: string
  tagline?: string
  tagline_ar?: string
  phone?: string
  phone_alt?: string
  email?: string
  address?: string
  address_ar?: string
  city?: string
  country?: string
  tax_number?: string
  license_number?: string
  currency?: string
  timezone?: string
  date_format?: string
  time_format?: string
  working_days?: number[]
  working_hours_start?: string
  working_hours_end?: string
  appointment_duration?: number
  primary_color?: string
  invoice_prefix?: string
  invoice_notes?: string
  invoice_footer?: string
}

export interface Holiday {
  id: string
  name: string
  name_ar: string | null
  date: string
  is_recurring: boolean
  created_at: string
  updated_at: string
}

export interface HolidayInput {
  name: string
  name_ar?: string
  date: string
  is_recurring?: boolean
}

export interface NotificationTemplate {
  id: string
  name: string
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app'
  event: string
  subject: string | null
  body: string
  body_ar: string | null
  variables: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NotificationTemplateInput {
  name: string
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app'
  event: string
  subject?: string
  body: string
  body_ar?: string
  variables?: string[]
  is_active?: boolean
}

export interface StaffUser {
  id: string
  role: UserRole
  first_name: string
  last_name: string
  display_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateUserInput {
  email: string
  password: string
  first_name: string
  last_name: string
  role: UserRole
  phone?: string
}

export interface UpdateUserInput {
  first_name?: string
  last_name?: string
  role?: UserRole
  phone?: string
  is_active?: boolean
}

export interface Permission {
  id: string
  module: string
  action: string
}

export interface RolePermission {
  role: UserRole
  permission_id: string
}

export interface RolePermissionMatrix {
  [role: string]: {
    [module: string]: {
      [action: string]: boolean
    }
  }
}
