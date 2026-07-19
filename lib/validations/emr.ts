import { z } from 'zod'

// ── Visit ────────────────────────────────────────────────────

export const createVisitSchema = z.object({
  patient_id: z.string().uuid('Invalid patient'),
  doctor_id: z.string().uuid('Invalid doctor'),
  appointment_id: z.string().uuid().optional(),
  visit_date: z.string().min(1, 'Visit date required'),
  visit_type: z.enum(['outpatient', 'follow_up', 'emergency', 'teleconsult']),
  chief_complaint: z.string().min(3, 'Chief complaint required').max(1000),
})

export type CreateVisitSchema = z.infer<typeof createVisitSchema>

// ── Vitals ───────────────────────────────────────────────────

const optionalPositive = (max: number) =>
  z.number().positive().max(max).nullable().optional()

export const vitalsSchema = z.object({
  weight_kg:            optionalPositive(500),
  height_cm:            optionalPositive(300),
  temperature_c:        z.number().min(30).max(45).nullable().optional(),
  systolic_bp:          z.number().int().min(50).max(300).nullable().optional(),
  diastolic_bp:         z.number().int().min(30).max(200).nullable().optional(),
  pulse_bpm:            z.number().int().min(20).max(300).nullable().optional(),
  spo2_pct:             z.number().int().min(50).max(100).nullable().optional(),
  respiratory_rate:     z.number().int().min(5).max(60).nullable().optional(),
  blood_glucose_mgdl:   optionalPositive(1000),
  notes:                z.string().max(500).nullable().optional(),
}).refine(
  (d) => d.systolic_bp == null || d.diastolic_bp == null || d.systolic_bp > d.diastolic_bp,
  { message: 'Systolic must be greater than diastolic', path: ['systolic_bp'] }
)

export type VitalsSchema = z.infer<typeof vitalsSchema>

// ── ICD-10 code ──────────────────────────────────────────────

export const icd10Schema = z.object({
  code: z.string().min(3).max(10),
  description: z.string().min(1),
  type: z.enum(['primary', 'secondary']),
})

// ── SOAP Note ────────────────────────────────────────────────

export const soapSchema = z.object({
  subjective:     z.string().max(5000).optional(),
  objective:      z.string().max(5000).optional(),
  assessment:     z.string().max(5000).optional(),
  plan:           z.string().max(5000).optional(),
  diagnoses:      z.array(icd10Schema).optional(),
  follow_up_date: z.string().nullable().optional(),
  follow_up_notes:z.string().max(1000).nullable().optional(),
}).refine(
  (d) => d.subjective || d.objective || d.assessment || d.plan,
  { message: 'At least one SOAP field required' }
)

export type SOAPSchema = z.infer<typeof soapSchema>
