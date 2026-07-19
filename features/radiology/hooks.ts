'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RadiologyOrder, RadiologyFilters, RadiologyStatus } from '@/types/radiology'
import {
  createRadiologyOrder,
  updateRadiologyOrder,
  updateRadiologyReport,
  updateRadiologyStatus,
  deleteRadiologyOrder,
  deleteRadiologyAttachment,
} from './actions'

const RADIO_SELECT = `
  *,
  patients ( id, full_name, patient_number, phone, date_of_birth ),
  doctors ( id, specialty, profiles ( display_name ) ),
  radiology_types ( id, name, name_ar, price ),
  radiology_attachments ( * )
`

export function useRadiologyOrders(filters: RadiologyFilters) {
  return useQuery({
    queryKey: ['radiology-orders', filters],
    queryFn: async () => {
      const supabase = createClient()
      const {
        search, patient_id, doctor_id, type_id, status,
        date_from, date_to,
        page = 1, pageSize = 50,
      } = filters

      let query = supabase
        .from('radiology_orders')
        .select(RADIO_SELECT, { count: 'exact' })
        .order('requested_at', { ascending: false })

      if (patient_id) query = query.eq('patient_id', patient_id)
      if (doctor_id) query = query.eq('doctor_id', doctor_id)
      if (type_id) query = query.eq('type_id', type_id)
      if (status) query = query.eq('status', status)
      if (date_from) query = query.gte('requested_at', `${date_from}T00:00:00`)
      if (date_to) query = query.lte('requested_at', `${date_to}T23:59:59`)
      if (search) query = query.ilike('order_number', `%${search}%`)

      const from = (page - 1) * pageSize
      const { data, error, count } = await query.range(from, from + pageSize - 1)
      if (error) throw error
      return { data: (data ?? []) as RadiologyOrder[], count: count ?? 0 }
    },
  })
}

export function useRadiologyOrder(id: string) {
  return useQuery({
    queryKey: ['radiology-order', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('radiology_orders')
        .select(RADIO_SELECT)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as RadiologyOrder
    },
    enabled: !!id,
  })
}

export function useRadiologyTypes() {
  return useQuery({
    queryKey: ['radiology-types'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('radiology_types')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data ?? []
    },
  })
}

export function usePatientRadiologyOrders(patient_id: string) {
  return useQuery({
    queryKey: ['radiology-orders', 'patient', patient_id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('radiology_orders')
        .select(RADIO_SELECT)
        .eq('patient_id', patient_id)
        .order('requested_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as RadiologyOrder[]
    },
    enabled: !!patient_id,
  })
}

export function useCreateRadiologyOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createRadiologyOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['radiology-orders'] }),
  })
}

export function useUpdateRadiologyOrder(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => updateRadiologyOrder(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['radiology-orders'] })
      qc.invalidateQueries({ queryKey: ['radiology-order', id] })
    },
  })
}

export function useUpdateRadiologyReport(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => updateRadiologyReport(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['radiology-orders'] })
      qc.invalidateQueries({ queryKey: ['radiology-order', id] })
    },
  })
}

export function useUpdateRadiologyStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RadiologyStatus }) =>
      updateRadiologyStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['radiology-orders'] }),
  })
}

export function useDeleteRadiologyOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteRadiologyOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['radiology-orders'] }),
  })
}

export function useDeleteRadiologyAttachment(orderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) => deleteRadiologyAttachment(attachmentId, orderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['radiology-order', orderId] }),
  })
}
