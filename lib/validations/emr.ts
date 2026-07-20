import { z } from 'zod'

// ── Visit ────────────────────────────────────────────────────
// Note: no `visit_type` column on `visits` in the current schema.

export const createVisitSchema = z.object({
  patient_id: z.string().uuid('Invalid patient'),
  doctor_id: z.string().uuid('Invalid doctor'),
  appointment_id: z.string().uuid().optional(),
  visit_date: z.string().min(1, 'Visit date required'),
  chief_complaint: z.string().min(3, 'Chief complaint required').max(1000),
})

export type CreateVisitSchema = z.infer<typeof createVisitSchema>

// ── Vitals ───────────────────────────────────────────────────
// Field names match the `vitals` table columns directly.

const optionalPositive = (max: number) =>
  z.number().positive().max(max).nullable().optional()

export const vitalsSchema = z.object({
  weight:              optionalPositive(500),
  height:              optionalPositive(300),
  temperature:          z.number().min(30).max(45).nullable().optional(),
  blood_pressure_systolic:  z.number().int().min(50).max(300).nullable().optional(),
  blood_pressure_diastolic: z.number().int().min(30).max(200).nullable().optional(),
  pulse:                z.number().int().min(20).max(300).nullable().optional(),
  oxygen_saturation:     z.number().int().min(50).max(100).nullable().optional(),
  respiratory_rate:     z.number().int().min(5).max(60).nullable().optional(),
  notes:                z.string().max(500).nullable().optional(),
}).refine(
  (d) => d.blood_pressure_systolic == null || d.blood_pressure_diastolic == null || d.blood_pressure_systolic > d.blood_pressure_diastolic,
  { message: 'Systolic must be greater than diastolic', path: ['blood_pressure_systolic'] }
)

export type VitalsSchema = z.infer<typeof vitalsSchema>

// ── ICD-10 code ──────────────────────────────────────────────
// Used for the diagnosis entry UI only. The schema persists just
// the `code` strings (soap_notes.diagnosis_codes: string[]) — the
// description/type here are for a nicer add-a-diagnosis UX and
// aren't stored server-side.

export const icd10Schema = z.object({
  code: z.string().min(3).max(10),
  description: z.string().min(1),
  type: z.enum(['primary', 'secondary']),
})

// ── SOAP Note ────────────────────────────────────────────────
// No e-signing or follow-up columns in the current schema.

export const soapSchema = z.object({
  subjective:     z.string().max(5000).optional(),
  objective:      z.string().max(5000).optional(),
  assessment:     z.string().max(5000).optional(),
  plan:           z.string().max(5000).optional(),
}).refine(
  (d) => d.subjective || d.objective || d.assessment || d.plan,
  { message: 'At least one SOAP field required' }
)

export type SOAPSchema = z.infer<typeof soapSchema>
