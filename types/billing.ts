import type { Database } from '@/types/database'

export type InvoiceStatus = Database['public']['Enums']['invoice_status']
export type PaymentMethod = Database['public']['Enums']['payment_method']
export type PaymentStatus = Database['public']['Enums']['payment_status']

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  discount: number
  total: number
  sort_order: number
}

export interface Invoice {
  id: string
  invoice_number: string
  patient_id: string
  doctor_id: string | null
  visit_id: string | null
  appointment_id: string | null
  issued_at: string
  due_date: string | null
  status: InvoiceStatus
  subtotal: number
  discount_type: 'flat' | 'percent' | null
  discount_value: number
  discount_amount: number
  tax_percent: number
  tax_amount: number
  total: number
  paid_amount: number
  balance: number
  currency: string
  notes: string | null
  insurance_claim: string | null
  pdf_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // joined
  patients?: {
    id: string
    full_name: string
    patient_number: string
    phone: string
  } | null
  doctors?: {
    id: string
    specialty: string
    profiles: { display_name: string } | null
  } | null
  invoice_items?: InvoiceItem[]
}

export interface Payment {
  id: string
  payment_number: string
  invoice_id: string
  patient_id: string
  amount: number
  method: PaymentMethod
  reference: string | null
  notes: string | null
  paid_at: string
  received_by: string | null
  created_at: string
  // joined
  invoices?: { invoice_number: string; total: number } | null
  patients?: { full_name: string; patient_number: string } | null
}

export interface Refund {
  id: string
  payment_id: string
  invoice_id: string
  amount: number
  reason: string
  refunded_at: string
  refunded_by: string | null
  created_at: string
}

export interface InvoiceItemInput {
  description: string
  quantity: number
  unit_price: number
  discount: number
  sort_order?: number
}

export interface InvoiceInput {
  patient_id: string
  doctor_id?: string | null
  visit_id?: string | null
  appointment_id?: string | null
  due_date?: string | null
  status?: InvoiceStatus
  discount_type?: 'flat' | 'percent' | null
  discount_value?: number
  tax_percent?: number
  notes?: string | null
  insurance_claim?: string | null
  items: InvoiceItemInput[]
}

export interface PaymentInput {
  invoice_id: string
  amount: number
  method: PaymentMethod
  reference?: string | null
  notes?: string | null
  paid_at?: string
}

export interface RefundInput {
  payment_id: string
  invoice_id: string
  amount: number
  reason: string
}

export interface BillingFilters {
  search?: string
  status?: InvoiceStatus
  patient_id?: string
  doctor_id?: string
  date_from?: string
  date_to?: string
  page?: number
  pageSize?: number
  sortBy?: 'issued_at' | 'total' | 'balance' | 'invoice_number'
  sortDir?: 'asc' | 'desc'
}

export interface BillingSummary {
  total_invoiced: number
  total_paid: number
  total_outstanding: number
  total_refunded: number
  invoice_count: number
  paid_count: number
  partial_count: number
  overdue_count: number
}
