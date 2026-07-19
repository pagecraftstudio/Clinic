import { z } from 'zod'

export const labTestResultSchema = z.object({
  test_name: z.string().min(1, 'Test name required'),
  value: z.string().max(500).nullable().optional(),
  unit: z.string().max(100).nullable().optional(),
  reference_range: z.string().max(200).nullable().optional(),
  is_abnormal: z.boolean().default(false),
  notes: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().default(0),
})

export const labRequestSchema = z.object({
  patient_id: z.string().uuid('Invalid patient'),
  doctor_id: z.string().uuid('Invalid doctor'),
  visit_id: z.string().uuid().nullable().optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
  diagnosis: z.string().max(500).nullable().optional(),
  clinical_notes: z.string().max(1000).nullable().optional(),
  tests: z.array(labTestResultSchema).min(1, 'At least one test required'),
})

export const labResultUpdateSchema = z.object({
  report_notes: z.string().max(2000).nullable().optional(),
  tests: z.array(labTestResultSchema).min(1, 'At least one test required'),
})

export type LabRequestFormValues = z.infer<typeof labRequestSchema>
export type LabResultUpdateFormValues = z.infer<typeof labResultUpdateSchema>
export type LabTestResultFormValues = z.infer<typeof labTestResultSchema>
