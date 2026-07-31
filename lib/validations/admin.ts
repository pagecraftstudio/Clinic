import { z } from 'zod'

export const featureFlagSchema = z.object({
  key: z.string().min(1, 'Key is required').regex(/^[a-z0-9_.-]+$/, 'Lowercase, numbers, - _ . only'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  is_enabled: z.boolean().default(false),
  rollout_percent: z.number().min(0).max(100).default(100),
  clinic_id: z.string().uuid().nullable().optional(),
})

export const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  severity: z.enum(['info', 'warning', 'critical']).default('info'),
  ends_at: z.string().optional().nullable(),
})

export const maintenanceModeSchema = z.object({
  enabled: z.boolean(),
  message: z.string().optional().default(''),
})

export const clinicSuspendSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
})
