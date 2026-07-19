import { z } from 'zod'

export const clinicSettingsSchema = z.object({
  name: z.string().min(1, 'Clinic name is required'),
  name_ar: z.string().optional(),
  tagline: z.string().optional(),
  tagline_ar: z.string().optional(),
  phone: z.string().optional(),
  phone_alt: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  address_ar: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('EG'),
  tax_number: z.string().optional(),
  license_number: z.string().optional(),
  currency: z.string().default('EGP'),
  timezone: z.string().default('Africa/Cairo'),
  date_format: z.string().default('DD/MM/YYYY'),
  time_format: z.enum(['12h', '24h']).default('12h'),
  working_days: z.array(z.number().min(0).max(6)).default([0, 1, 2, 3, 4]),
  working_hours_start: z.string().default('08:00'),
  working_hours_end: z.string().default('20:00'),
  appointment_duration: z.number().min(5).max(180).default(30),
  primary_color: z.string().default('#0066FF'),
  invoice_prefix: z.string().min(1).max(10).default('INV'),
  invoice_notes: z.string().optional(),
  invoice_footer: z.string().optional(),
})

export const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  name_ar: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  is_recurring: z.boolean().default(false),
})

export const notificationTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  channel: z.enum(['email', 'sms', 'whatsapp', 'push', 'in_app']),
  event: z.string().min(1, 'Event is required'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Body is required'),
  body_ar: z.string().optional(),
  variables: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
})

export const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  role: z.enum([
    'owner', 'admin', 'doctor', 'receptionist', 'nurse',
    'cashier', 'accountant', 'lab_technician', 'radiology_technician',
    'pharmacist', 'marketing', 'patient',
  ]),
  phone: z.string().optional(),
})

export const updateUserSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  role: z.enum([
    'owner', 'admin', 'doctor', 'receptionist', 'nurse',
    'cashier', 'accountant', 'lab_technician', 'radiology_technician',
    'pharmacist', 'marketing', 'patient',
  ]).optional(),
  phone: z.string().optional(),
  is_active: z.boolean().optional(),
})

export type ClinicSettingsInput = z.infer<typeof clinicSettingsSchema>
export type HolidayInput = z.infer<typeof holidaySchema>
export type NotificationTemplateInput = z.infer<typeof notificationTemplateSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
