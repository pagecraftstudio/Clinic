import { z } from 'zod'

const workingHoursSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  is_active: z.boolean(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  break_start: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  break_end: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  slot_duration: z.coerce.number().int().min(5).max(120).default(30),
})

export const doctorSchema = z.object({
  // profile fields
  first_name: z.string().min(1, 'First name required').max(100),
  last_name: z.string().min(1, 'Last name required').max(100),
  display_name: z.string().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email('Valid email required'),
  avatar_url: z.string().url().optional().nullable().or(z.literal('')),
  // doctor fields
  specialty: z.string().min(1, 'Specialty required').max(100),
  sub_specialty: z.string().max(100).optional().nullable(),
  license_number: z.string().max(100).optional().nullable(),
  consultation_fee: z.coerce.number().min(0, 'Must be ≥ 0'),
  follow_up_fee: z.coerce.number().min(0, 'Must be ≥ 0'),
  bio: z.string().max(2000).optional().nullable(),
  is_active: z.boolean().default(true),
  accepts_online: z.boolean().default(false),
  working_hours: z.array(workingHoursSchema).length(7),
})

export type DoctorSchema = z.infer<typeof doctorSchema>

export const leaveSchema = z.object({
  start_date: z.string().min(1, 'Start date required'),
  end_date: z.string().min(1, 'End date required'),
  reason: z.string().max(500).optional().nullable(),
})

export type LeaveSchema = z.infer<typeof leaveSchema>
