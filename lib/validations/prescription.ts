import { z } from 'zod'

export const prescriptionItemSchema = z.object({
  medicine_name: z.string().min(1, 'Medicine name required'),
  strength: z.string().max(100).nullable().optional(),
  form: z.string().max(100).nullable().optional(),
  dosage: z.string().min(1, 'Dosage required'),
  frequency: z.string().min(1, 'Frequency required'),
  duration: z.string().min(1, 'Duration required'),
  quantity: z.coerce.number().int().positive().nullable().optional(),
  route: z.string().max(100).nullable().optional(),
  instructions: z.string().max(500).nullable().optional(),
  is_prn: z.boolean().default(false),
  sort_order: z.number().int().default(0),
})

export const prescriptionSchema = z.object({
  patient_id: z.string().uuid('Invalid patient'),
  doctor_id: z.string().uuid('Invalid doctor'),
  visit_id: z.string().uuid().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  diagnosis: z.string().max(500).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one medicine required'),
})

export type PrescriptionFormValues = z.infer<typeof prescriptionSchema>
export type PrescriptionItemFormValues = z.infer<typeof prescriptionItemSchema>
