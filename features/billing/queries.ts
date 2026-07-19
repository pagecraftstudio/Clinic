import { createClient } from '@/lib/supabase/server'
import type { Invoice, Payment, BillingFilters, BillingSummary } from '@/types/billing'

const INVOICE_SELECT = `
  *,
  patients ( id, full_name, patient_number, phone ),
  doctors ( id, specialty, profiles ( display_name ) ),
  invoice_items ( * )
`

const PAYMENT_SELECT = `
  *,
  invoices ( invoice_number, total ),
  patients ( full_name, patient_number )
`

export async function getInvoices(filters: BillingFilters = {}) {
  const supabase = await createClient()
  const {
    search, status, patient_id, doctor_id,
    date_from, date_to,
    page = 1, pageSize = 50,
    sortBy = 'issued_at', sortDir = 'desc',
  } = filters

  let query = supabase
    .from('invoices')
    .select(INVOICE_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order(sortBy, { ascending: sortDir === 'asc' })

  if (search) {
    query = query.or(`invoice_number.ilike.%${search}%,patients.full_name.ilike.%${search}%`)
  }
  if (status) query = query.eq('status', status)
  if (patient_id) query = query.eq('patient_id', patient_id)
  if (doctor_id) query = query.eq('doctor_id', doctor_id)
  if (date_from) query = query.gte('issued_at', `${date_from}T00:00:00`)
  if (date_to) query = query.lte('issued_at', `${date_to}T23:59:59`)

  const from = (page - 1) * pageSize
  const { data, error, count } = await query.range(from, from + pageSize - 1)
  if (error) throw error
  return { data: (data ?? []) as Invoice[], count: count ?? 0 }
}

export async function getInvoiceById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error
  return data as Invoice
}

export async function getPaymentsByInvoice(invoice_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*, profiles ( display_name )')
    .eq('invoice_id', invoice_id)
    .order('paid_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getPayments(filters: { patient_id?: string; page?: number; pageSize?: number } = {}) {
  const supabase = await createClient()
  const { patient_id, page = 1, pageSize = 50 } = filters

  let query = supabase
    .from('payments')
    .select(PAYMENT_SELECT, { count: 'exact' })
    .order('paid_at', { ascending: false })

  if (patient_id) query = query.eq('patient_id', patient_id)

  const from = (page - 1) * pageSize
  const { data, error, count } = await query.range(from, from + pageSize - 1)
  if (error) throw error
  return { data: (data ?? []) as Payment[], count: count ?? 0 }
}

export async function getRefundsByInvoice(invoice_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('refunds')
    .select('*, profiles ( display_name )')
    .eq('invoice_id', invoice_id)
    .order('refunded_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getBillingSummary(): Promise<BillingSummary> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('status, total, paid_amount, due_date')
    .is('deleted_at', null)

  if (error) throw error

  const now = new Date()
  let total_invoiced = 0, total_paid = 0, total_outstanding = 0
  let invoice_count = 0, paid_count = 0, partial_count = 0, overdue_count = 0

  for (const inv of data ?? []) {
    invoice_count++
    total_invoiced += inv.total ?? 0
    total_paid += inv.paid_amount ?? 0
    const balance = (inv.total ?? 0) - (inv.paid_amount ?? 0)
    total_outstanding += balance > 0 ? balance : 0
    if (inv.status === 'paid') paid_count++
    if (inv.status === 'partial') partial_count++
    if (
      balance > 0 &&
      inv.due_date &&
      new Date(inv.due_date) < now &&
      inv.status !== 'paid' &&
      inv.status !== 'cancelled'
    ) overdue_count++
  }

  // approximate refunded from refunds table
  const { data: refunds } = await supabase.from('refunds').select('amount')
  const total_refunded = (refunds ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)

  return {
    total_invoiced, total_paid, total_outstanding, total_refunded,
    invoice_count, paid_count, partial_count, overdue_count,
  }
}

export async function getPatientInvoices(patient_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items (*)')
    .eq('patient_id', patient_id)
    .is('deleted_at', null)
    .order('issued_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Invoice[]
}
