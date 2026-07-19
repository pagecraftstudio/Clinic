import { z } from 'zod'

export const radiologyOrderSchema = z.object({
  patient_id: z.string().uuid('Invalid patient'),
  doctor_id: z.string().uuid('Invalid doctor'),
  visit_id: z.string().uuid().nullable().optional(),
  type_id: z.string().uuid('Select a radiology type'),
  body_part: z.string().max(200).nullable().optional(),
  clinical_info: z.string().max(1000).nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
})

export const radiologyReportSchema = z.object({
  findings: z.string().max(5000).nullable().optional(),
  impression: z.string().max(2000).nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
})

export type RadiologyOrderFormValues = z.infer<typeof radiologyOrderSchema>
export type RadiologyReportFormValues = z.infer<typeof radiologyReportSchema>
