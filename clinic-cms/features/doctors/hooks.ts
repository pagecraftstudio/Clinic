'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Doctor, DoctorFilters } from '@/types/doctor'
import {
  createDoctor, updateDoctor, toggleDoctorActive,
  deleteDoctor, createLeave, deleteLeave,
} from './actions'

const DOCTOR_SELECT = `
  *,
  profiles ( id, first_name, last_name, display_name, avatar_url, phone, email )
`

export function useDoctors(filters: DoctorFilters = {}) {
  return useQuery({
    queryKey: ['doctors', filters],
    queryFn: async () => {
      const supabase = createClient()
      const { search, specialty, is_active, accepts_online, page = 1, pageSize = 20 } = filters

      let query = supabase
        .from('doctors')
        .select(DOCTOR_SELECT, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (typeof is_active === 'boolean') query = query.eq('is_active', is_active)
      if (typeof accepts_online === 'boolean') query = query.eq('accepts_online', accepts_online)
      if (specialty) query = query.eq('specialty', specialty)
      if (search) {
        query = query.or(
          `specialty.ilike.%${search}%,license_number.ilike.%${search}%,employee_number.ilike.%${search}%`
        )
      }

      const from = (page - 1) * pageSize
      const { data, error, count } = await query.range(from, from + pageSize - 1)
      if (error) throw error
      return { data: (data ?? []) as Doctor[], count: count ?? 0 }
    },
    staleTime: 60_000,
  })
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('doctors')
        .select(`${DOCTOR_SELECT}, leaves:doctor_leaves(*)`)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Doctor
    },
    enabled: !!id,
  })
}

export function useSpecialties() {
  return useQuery({
    queryKey: ['doctor-specialties'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('doctors')
        .select('specialty')
        .eq('is_active', true)
        .order('specialty')
      if (error) throw error
      return [...new Set((data ?? []).map((d) => d.specialty).filter(Boolean))] as string[]
    },
    staleTime: 5 * 60_000,
  })
}

export function useDoctorAppointmentStats(doctor_id: string) {
  return useQuery({
    queryKey: ['doctor-stats', doctor_id],
    queryFn: async () => {
      const supabase = createClient()
      const today = new Date().toISOString().slice(0, 10)

      const [{ count: total }, { count: today_count }, { count: upcoming }] = await Promise.all([
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', doctor_id),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('doctor_id', doctor_id)
          .gte('scheduled_at', `${today}T00:00:00`)
          .lte('scheduled_at', `${today}T23:59:59`),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('doctor_id', doctor_id)
          .gte('scheduled_at', new Date().toISOString())
          .not('status', 'in', '("cancelled","no_show","completed")'),
      ])

      return { total: total ?? 0, today: today_count ?? 0, upcoming: upcoming ?? 0 }
    },
    enabled: !!doctor_id,
  })
}

function useDoctorMutation<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<{ success: boolean; error?: string }>,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (...args: TArgs) => fn(...args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] })
    },
  })
}

export const useCreateDoctor       = () => useDoctorMutation((data: unknown) => createDoctor(data))
export const useUpdateDoctor       = () => useDoctorMutation((id: string, data: unknown) => updateDoctor(id, data))
export const useToggleDoctorActive = () => useDoctorMutation((id: string, active: boolean) => toggleDoctorActive(id, active))
export const useDeleteDoctor       = () => useDoctorMutation((id: string) => deleteDoctor(id))
export const useCreateLeave        = () => useDoctorMutation((doctor_id: string, data: unknown) => createLeave(doctor_id, data))
export const useDeleteLeave        = () => useDoctorMutation((leave_id: string, doctor_id: string) => deleteLeave(leave_id, doctor_id))
