import { z } from 'zod'

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] as const
export const GENDERS = ['male', 'female', 'other'] as const
export const PATIENT_SOURCES = ['walk_in', 'online', 'referral', 'other'] as const

const egyptPhone = /^(01[0125][0-9]{8}|\+201[0125][0-9]{8})$/

export const emergencyContactSchema = z.object({
  name: z.string().min(2, 'Name too short').max(120),
  relation: z.string().min(2, 'Relation required').max(60),
  phone: z.string().regex(egyptPhone, 'Enter a valid Egyptian phone number'),
  phone_alt: z.string().regex(egyptPhone, 'Enter a valid phone number').optional().or(z.literal('')),
  is_primary: z.boolean().default(false),
})

export const patientSchema = z.object({
  first_name: z.string().min(2, 'First name is required').max(80),
  last_name: z.string().min(2, 'Last name is required').max(80),
  first_name_ar: z.string().max(80).optional().or(z.literal('')),
  last_name_ar: z.string().max(80).optional().or(z.literal('')),
  date_of_birth: z.string().optional().nullable(),
  gender: z.enum(GENDERS).optional().nullable(),
  blood_group: z.enum(BLOOD_GROUPS).default('unknown'),
  national_id: z
    .string()
    .regex(/^\d{14}$/, 'National ID must be 14 digits')
    .optional()
    .or(z.literal('')),
  passport_number: z.string().max(30).optional().or(z.literal('')),
  phone: z.string().regex(egyptPhone, 'Enter a valid Egyptian phone number'),
  phone_alt: z.string().regex(egyptPhone, 'Enter a valid phone number').optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
  city: z.string().max(80).optional().or(z.literal('')),
  governorate: z.string().max(80).optional().or(z.literal('')),
  country: z.string().default('EG'),
  occupation: z.string().max(80).optional().or(z.literal('')),
  marital_status: z.string().max(40).optional().or(z.literal('')),
  nationality: z.string().default('Egyptian'),
  language_pref: z.enum(['ar', 'en']).default('ar'),
  allergies: z.array(z.string()).default([]),
  chronic_diseases: z.array(z.string()).default([]),
  current_medications: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional().or(z.literal('')),
  insurance_company: z.string().max(120).optional().or(z.literal('')),
  insurance_number: z.string().max(60).optional().or(z.literal('')),
  insurance_expiry: z.string().optional().nullable(),
  source: z.enum(PATIENT_SOURCES).default('walk_in'),
  referred_by: z.string().uuid().optional().nullable(),
  emergency_contacts: z.array(emergencyContactSchema).max(5).default([]),
})

export type PatientFormValues = z.infer<typeof patientSchema>
export type EmergencyContactFormValues = z.infer<typeof emergencyContactSchema>

// Normalize empty-string optional fields to null before hitting the DB.
export function toPatientInsert(values: PatientFormValues) {
  const { emergency_contacts, ...rest } = values
  const cleaned = Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [k, v === '' ? null : v])
  )
  return { cleaned, emergency_contacts }
}
