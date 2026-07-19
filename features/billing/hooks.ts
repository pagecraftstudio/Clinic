'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { BillingFilters, Invoice, Payment } from '@/types/billing'
import {
  createInvoice, updateInvoice, updateInvoiceStatus,
  deleteInvoice, recordPayment, issueRefund,
} from './actions'

const INVOICE_SELECT = `
  *,
  patients ( id, full_name, patient_number, phone ),
  doctors ( id, specialty, profiles ( display_name ) ),
  invoice_items ( * )
`

export function useInvoices(filters: BillingFilters) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const supabase = createClient()
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

      if (search) query = query.ilike('invoice_number', `%${search}%`)
      if (status) query = query.eq('status', status)
      if (patient_id) query = query.eq('patient_id', patient_id)
      if (doctor_id) query = query.eq('doctor_id', doctor_id)
      if (date_from) query = query.gte('issued_at', `${date_from}T00:00:00`)
      if (date_to) query = query.lte('issued_at', `${date_to}T23:59:59`)

      const from = (page - 1) * pageSize
      const { data, error, count } = await query.range(from, from + pageSize - 1)
      if (error) throw error
      return { data: (data ?? []) as Invoice[], count: count ?? 0 }
    },
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('invoices')
        .select(INVOICE_SELECT)
        .eq('id', id)
        .is('deleted_at', null)
        .single()
      if (error) throw error
      return data as Invoice
    },
    enabled: !!id,
  })
}

export function usePaymentsByInvoice(invoice_id: string) {
  return useQuery({
    queryKey: ['payments', 'invoice', invoice_id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('payments')
        .select('*, profiles ( display_name )')
        .eq('invoice_id', invoice_id)
        .order('paid_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!invoice_id,
  })
}

export function useRefundsByInvoice(invoice_id: string) {
  return useQuery({
    queryKey: ['refunds', 'invoice', invoice_id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('refunds')
        .select('*, profiles ( display_name )')
        .eq('invoice_id', invoice_id)
        .order('refunded_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!invoice_id,
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export function useUpdateInvoice(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => updateInvoice(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice', id] })
    },
  })
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Parameters<typeof updateInvoiceStatus>[1] }) =>
      updateInvoiceStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export function useDeleteInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}

export function useIssueRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: issueRefund,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['refunds'] })
    },
  })
}
