import { z } from 'zod'

export const appointmentSchema = z.object({
  patient_id: z.string().uuid('Select a valid patient'),
  doctor_id: z.string().uuid('Select a valid doctor'),
  scheduled_at: z.string().min(1, 'Date & time required'),
  duration: z.coerce.number().int().min(10).max(480).default(30),
  type: z.enum(['in_person', 'online', 'follow_up', 'urgent', 'routine']),
  chief_complaint: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  is_online: z.boolean().default(false),
  online_link: z.string().url().optional().nullable().or(z.literal('')),
})

export type AppointmentSchema = z.infer<typeof appointmentSchema>

export const rescheduleSchema = z.object({
  scheduled_at: z.string().min(1, 'Date & time required'),
  duration: z.coerce.number().int().min(10).max(480).default(30),
  notes: z.string().max(500).optional().nullable(),
})

export const cancelSchema = z.object({
  cancellation_reason: z.string().min(1, 'Reason required').max(500),
})
