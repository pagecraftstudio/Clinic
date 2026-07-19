'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Patient, PatientFilters } from '@/types/patient'
import { createPatient, updatePatient, deactivatePatient, reactivatePatient } from './actions'

export function usePatients(filters: PatientFilters) {
  return useQuery({
    queryKey: ['patients', filters],
    queryFn: async () => {
      const supabase = createClient()
      const {
        search, gender, blood_group, is_active = true, governorate,
        page = 1, pageSize = 20, sortBy = 'created_at', sortDir = 'desc',
      } = filters

      let query = supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .eq('is_active', is_active)

      if (search) {
        const term = search.trim()
        query = query.or(
          `full_name.ilike.%${term}%,phone.ilike.%${term}%,national_id.ilike.%${term}%,patient_number.ilike.%${term}%`
        )
      }
      if (gender) query = query.eq('gender', gender)
      if (blood_group) query = query.eq('blood_group', blood_group)
      if (governorate) query = query.eq('governorate', governorate)

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data, error, count } = await query
        .order(sortBy, { ascending: sortDir === 'asc' })
        .range(from, to)

      if (error) throw error
      return {
        patients: (data ?? []) as Patient[],
        total: count ?? 0,
        pageCount: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      }
    },
    placeholderData: (prev) => prev,
  })
}

export function usePatientSearch(term: string) {
  return useQuery({
    queryKey: ['patient-search', term],
    enabled: term.trim().length >= 2,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('patients')
        .select('id, patient_number, full_name, phone, date_of_birth, gender')
        .is('deleted_at', null)
        .or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,patient_number.ilike.%${term}%`)
        .limit(8)
      if (error) throw error
      return data
    },
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: unknown) => createPatient(values),
    onSuccess: (result) => {
      if (result.success) queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: unknown) => updatePatient(id, values),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['patients'] })
        queryClient.invalidateQueries({ queryKey: ['patient', id] })
      }
    },
  })
}

export function useDeactivatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deactivatePatient(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  })
}

export function useReactivatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reactivatePatient(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  })
}
