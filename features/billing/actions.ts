'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { invoiceSchema, paymentSchema, refundSchema } from '@/lib/validations/billing'
import type { InvoiceInput, PaymentInput, RefundInput } from '@/types/billing'

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

// ── helpers ──────────────────────────────────────────────────────────────────

function calcInvoiceTotals(
  items: Array<{ quantity: number; unit_price: number; discount: number }>,
  discount_type: string | null | undefined,
  discount_value: number,
  tax_percent: number,
) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price - i.discount, 0)
  const discount_amount =
    discount_type === 'percent'
      ? subtotal * (discount_value / 100)
      : discount_type === 'flat'
        ? discount_value
        : 0
  const after_discount = subtotal - discount_amount
  const tax_amount = after_discount * (tax_percent / 100)
  const total = after_discount + tax_amount
  return { subtotal, discount_amount, tax_amount, total }
}

// ── invoices ─────────────────────────────────────────────────────────────────

export async function createInvoice(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = invoiceSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const { items, discount_type, discount_value = 0, tax_percent = 0, ...rest } = parsed.data

  const { subtotal, discount_amount, tax_amount, total } = calcInvoiceTotals(
    items, discount_type, discount_value, tax_percent,
  )

  // generate invoice number
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
  const num = String((count ?? 0) + 1).padStart(6, '0')
  const invoice_number = `INV-${num}`

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      ...rest,
      discount_type: discount_type ?? null,
      discount_value,
      tax_percent,
      invoice_number,
      subtotal,
      discount_amount,
      tax_amount,
      total,
      paid_amount: 0,
      created_by: auth.user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  const itemRows = items.map((item, idx) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount: item.discount,
    sort_order: item.sort_order ?? idx,
  }))

  const { error: itemError } = await supabase.from('invoice_items').insert(itemRows)
  if (itemError) return { success: false, error: itemError.message }

  revalidatePath('/billing')
  return { success: true, data: { id: invoice.id } }
}

export async function updateInvoice(
  id: string,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = invoiceSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { items, discount_type, discount_value = 0, tax_percent = 0, ...rest } = parsed.data

  const { subtotal, discount_amount, tax_amount, total } = calcInvoiceTotals(
    items, discount_type, discount_value, tax_percent,
  )

  const { error } = await supabase
    .from('invoices')
    .update({
      ...rest,
      discount_type: discount_type ?? null,
      discount_value,
      tax_percent,
      subtotal,
      discount_amount,
      tax_amount,
      total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  // replace items
  await supabase.from('invoice_items').delete().eq('invoice_id', id)
  const itemRows = items.map((item, idx) => ({
    invoice_id: id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount: item.discount,
    sort_order: item.sort_order ?? idx,
  }))
  const { error: itemError } = await supabase.from('invoice_items').insert(itemRows)
  if (itemError) return { success: false, error: itemError.message }

  revalidatePath('/billing')
  revalidatePath(`/billing/${id}`)
  return { success: true, data: { id } }
}

export async function updateInvoiceStatus(
  id: string,
  status: 'draft' | 'issued' | 'partial' | 'paid' | 'refunded' | 'cancelled',
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/billing')
  revalidatePath(`/billing/${id}`)
  return { success: true }
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('invoices')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/billing')
  return { success: true }
}

// ── payments ─────────────────────────────────────────────────────────────────

export async function recordPayment(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = paymentSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const { invoice_id, amount, method, reference, notes, paid_at } = parsed.data

  // get invoice to validate and get patient_id
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('id, patient_id, balance, paid_amount, total, status')
    .eq('id', invoice_id)
    .single()
  if (invErr || !invoice) return { success: false, error: 'Invoice not found' }
  if (amount > invoice.balance + 0.01) {
    return { success: false, error: `Payment exceeds balance (${invoice.balance.toFixed(2)})` }
  }

  // generate payment number
  const { count } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
  const num = String((count ?? 0) + 1).padStart(6, '0')
  const payment_number = `PAY-${num}`

  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      payment_number,
      invoice_id,
      patient_id: invoice.patient_id,
      amount,
      method,
      reference: reference ?? null,
      notes: notes ?? null,
      paid_at: paid_at ?? new Date().toISOString(),
      received_by: auth.user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  // update invoice paid_amount + status
  const new_paid = invoice.paid_amount + amount
  const new_status =
    new_paid >= invoice.total - 0.01 ? 'paid'
    : new_paid > 0 ? 'partial'
    : invoice.status

  await supabase
    .from('invoices')
    .update({ paid_amount: new_paid, status: new_status, updated_at: new Date().toISOString() })
    .eq('id', invoice_id)

  revalidatePath('/billing')
  revalidatePath(`/billing/${invoice_id}`)
  return { success: true, data: { id: payment.id } }
}

// ── refunds ──────────────────────────────────────────────────────────────────

export async function issueRefund(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = refundSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const { payment_id, invoice_id, amount, reason } = parsed.data

  // validate payment amount
  const { data: payment } = await supabase
    .from('payments')
    .select('amount')
    .eq('id', payment_id)
    .single()
  if (!payment) return { success: false, error: 'Payment not found' }

  const { data: existingRefunds } = await supabase
    .from('refunds')
    .select('amount')
    .eq('payment_id', payment_id)
  const already_refunded = (existingRefunds ?? []).reduce((s, r) => s + r.amount, 0)
  if (amount > payment.amount - already_refunded + 0.01) {
    return { success: false, error: 'Refund exceeds available payment amount' }
  }

  const { data: refund, error } = await supabase
    .from('refunds')
    .insert({
      payment_id,
      invoice_id,
      amount,
      reason,
      refunded_by: auth.user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  // update invoice paid_amount
  const { data: invoice } = await supabase
    .from('invoices')
    .select('paid_amount, total')
    .eq('id', invoice_id)
    .single()

  if (invoice) {
    const new_paid = Math.max(0, invoice.paid_amount - amount)
    const new_status =
      new_paid <= 0 ? 'refunded'
      : new_paid < invoice.total - 0.01 ? 'partial'
      : 'paid'
    await supabase
      .from('invoices')
      .update({ paid_amount: new_paid, status: new_status, updated_at: new Date().toISOString() })
      .eq('id', invoice_id)
  }

  revalidatePath('/billing')
  revalidatePath(`/billing/${invoice_id}`)
  return { success: true, data: { id: refund.id } }
}
