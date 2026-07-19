'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Prescription, PrescriptionFilters } from '@/types/prescription'
import { createPrescription, updatePrescription, markDispensed, deletePrescription } from './actions'

const PRESCRIPTION_SELECT = `
  *,
  patients ( id, full_name, patient_number, phone, date_of_birth ),
  doctors ( id, specialty, profiles ( display_name ) ),
  prescription_items ( * )
`

export function usePrescriptions(filters: PrescriptionFilters) {
  return useQuery({
    queryKey: ['prescriptions', filters],
    queryFn: async () => {
      const supabase = createClient()
      const {
        search, patient_id, doctor_id, is_dispensed,
        date_from, date_to,
        page = 1, pageSize = 50,
      } = filters

      let query = supabase
        .from('prescriptions')
        .select(PRESCRIPTION_SELECT, { count: 'exact' })
        .order('prescribed_at', { ascending: false })

      if (search) query = query.ilike('prescription_number', `%${search}%`)
      if (patient_id) query = query.eq('patient_id', patient_id)
      if (doctor_id) query = query.eq('doctor_id', doctor_id)
      if (typeof is_dispensed === 'boolean') query = query.eq('is_dispensed', is_dispensed)
      if (date_from) query = query.gte('prescribed_at', `${date_from}T00:00:00`)
      if (date_to) query = query.lte('prescribed_at', `${date_to}T23:59:59`)

      const from = (page - 1) * pageSize
      const { data, error, count } = await query.range(from, from + pageSize - 1)
      if (error) throw error
      return { data: (data ?? []) as Prescription[], count: count ?? 0 }
    },
  })
}

export function usePrescription(id: string) {
  return useQuery({
    queryKey: ['prescription', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('prescriptions')
        .select(PRESCRIPTION_SELECT)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Prescription
    },
    enabled: !!id,
  })
}

export function usePatientPrescriptions(patient_id: string) {
  return useQuery({
    queryKey: ['prescriptions', 'patient', patient_id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('prescriptions')
        .select(PRESCRIPTION_SELECT)
        .eq('patient_id', patient_id)
        .order('prescribed_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Prescription[]
    },
    enabled: !!patient_id,
  })
}

export function useCreatePrescription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPrescription,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescriptions'] }),
  })
}

export function useUpdatePrescription(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: unknown) => updatePrescription(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] })
      qc.invalidateQueries({ queryKey: ['prescription', id] })
    },
  })
}

export function useMarkDispensed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markDispensed,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescriptions'] }),
  })
}

export function useDeletePrescription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePrescription,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescriptions'] }),
  })
}
