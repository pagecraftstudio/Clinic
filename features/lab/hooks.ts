'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { LabRequest, LabFilters, LabTestStatus } from '@/types/lab'
import {
  createLabRequest,
  updateLabResults,
  updateLabStatus,
  deleteLabRequest,
} from './actions'

const LAB_SELECT = `
  *,
  patients ( id, full_name, patient_number, phone, date_of_birth ),
  doctors ( id, specialty, profiles ( display_name ) ),
  technician:profiles!lab_requests_technician_id_fkey ( id, display_name ),
  lab_results ( * )
`

export function useLabRequests(filters: LabFilters) {
  return useQuery({
    queryKey: ['lab-requests', filters],
    queryFn: async () => {
      const supabase = createClient()
      const {
        search, patient_id, doctor_id, status, priority,
        date_from, date_to,
        page = 1, pageSize = 50,
      } = filters

      let query = supabase
        .from('lab_requests')
        .select(LAB_SELECT, { count: 'exact' })
        .order('requested_at', { ascending: false })

      if (search) query = query.ilike('request_number', `%${search}%`)
      if (patient_id) query = query.eq('patient_id', patient_id)
      if (doctor_id) query = query.eq('doctor_id', doctor_id)
      if (status) query = query.eq('status', status)
      if (priority) query = query.eq('priority', priority)
      if (date_from) query = query.gte('requested_at', `${date_from}T00:00:00`)
      if (date_to) query = query.lte('requested_at', `${date_to}T23:59:59`)

      const from = (page - 1) * pageSize
      const { data, error, count } = await query.range(from, from + pageSize - 1)
      if (error) throw error
      return { data: (data ?? []) as LabRequest[], count: count ?? 0 }
    },
  })
}

export function useLabRequest(id: string) {
  return useQuery({
    queryKey: ['lab-request', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lab_requests')
        .select(LAB_SELECT)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as LabRequest
    },
    enabled: !!id,
  })
}

export function usePatientLabRequests(patient_id: string) {
  return useQuery({
    queryKey: ['lab-requests', 'patient', patient_id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lab_requests')
        .select(LAB_SELECT)
        .eq('patient_id', patient_id)
        .order('requested_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as LabRequest[]
    },
    enabled: !!patient_id,
  })
}

export function useCreateLabRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createLabRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-requests'] }),
  })
}

export function useUpdateLabResults(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => updateLabResults(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-requests'] })
      qc.invalidateQueries({ queryKey: ['lab-request', id] })
    },
  })
}

export function useUpdateLabStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LabTestStatus }) =>
      updateLabStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-requests'] }),
  })
}

export function useDeleteLabRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteLabRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-requests'] }),
  })
}
