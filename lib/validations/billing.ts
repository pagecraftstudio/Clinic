import { z } from 'zod'

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit_price: z.coerce.number().min(0, 'Price must be ≥ 0'),
  discount: z.coerce.number().min(0).default(0),
  sort_order: z.number().int().default(0),
})

export const invoiceSchema = z.object({
  patient_id: z.string().uuid('Invalid patient'),
  doctor_id: z.string().uuid().nullable().optional(),
  visit_id: z.string().uuid().nullable().optional(),
  appointment_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  status: z.enum(['draft', 'issued', 'partial', 'paid', 'refunded', 'cancelled']).default('draft'),
  discount_type: z.enum(['flat', 'percent']).nullable().optional(),
  discount_value: z.coerce.number().min(0).default(0),
  tax_percent: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().max(1000).nullable().optional(),
  insurance_claim: z.string().max(200).nullable().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item required'),
})

export const paymentSchema = z.object({
  invoice_id: z.string().uuid('Invalid invoice'),
  amount: z.coerce.number().positive('Amount must be positive'),
  method: z.enum(['cash', 'card', 'bank_transfer', 'vodafone_cash', 'fawry', 'insurance']),
  reference: z.string().max(200).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  paid_at: z.string().optional(),
})

export const refundSchema = z.object({
  payment_id: z.string().uuid('Invalid payment'),
  invoice_id: z.string().uuid('Invalid invoice'),
  amount: z.coerce.number().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason required').max(500),
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>
export type PaymentFormValues = z.infer<typeof paymentSchema>
export type RefundFormValues = z.infer<typeof refundSchema>
