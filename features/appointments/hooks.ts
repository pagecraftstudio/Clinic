'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentFilters } from '@/types/appointment'
import {
  createAppointment, updateAppointment,
  checkInAppointment, startAppointment, completeAppointment,
  markNoShow, confirmAppointment, rescheduleAppointment,
  cancelAppointment, deleteAppointment,
} from './actions'

const APPOINTMENT_SELECT = `
  *,
  patients ( id, full_name, patient_number, phone, gender, date_of_birth ),
  doctors ( id, specialty, profiles ( first_name, last_name, display_name, avatar_url ) )
`

export function useAppointments(filters: AppointmentFilters) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      const supabase = createClient()
      const { date, week_start, month, doctor_id, status, type, patient_id, page = 1, pageSize = 100 } = filters

      let query = supabase
        .from('appointments')
        .select(APPOINTMENT_SELECT, { count: 'exact' })
        .is('deleted_at', null)
        .order('scheduled_at', { ascending: true })

      if (date) {
        query = query.gte('scheduled_at', `${date}T00:00:00`).lte('scheduled_at', `${date}T23:59:59`)
      } else if (week_start) {
        const end = new Date(week_start); end.setDate(end.getDate() + 6)
        query = query.gte('scheduled_at', `${week_start}T00:00:00`).lte('scheduled_at', `${end.toISOString().slice(0, 10)}T23:59:59`)
      } else if (month) {
        const [y, m] = month.split('-').map(Number)
        const endDay = new Date(y, m, 0)
        query = query.gte('scheduled_at', `${month}-01T00:00:00`).lte('scheduled_at', `${endDay.toISOString().slice(0, 10)}T23:59:59`)
      }

      if (doctor_id)  query = query.eq('doctor_id', doctor_id)
      if (status)     query = query.eq('status', status)
      if (type)       query = query.eq('type', type)
      if (patient_id) query = query.eq('patient_id', patient_id)

      const from = (page - 1) * pageSize
      const { data, error, count } = await query.range(from, from + pageSize - 1)
      if (error) throw error
      return { data: (data ?? []) as Appointment[], count: count ?? 0 }
    },
    staleTime: 30_000,
  })
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('appointments')
        .select(APPOINTMENT_SELECT)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Appointment
    },
    enabled: !!id,
  })
}

export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('doctors')
        .select('id, specialty, profiles ( first_name, last_name, display_name, avatar_url )')
        .eq('is_active', true)
        .order('specialty')
      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60_000,
  })
}

function useAppointmentMutation<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<{ success: boolean; error?: string }>,
  invalidate = true,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: TArgs) => fn(...args),
    onSuccess: () => {
      if (invalidate) qc.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export const useCreateAppointment  = () => useAppointmentMutation((data: unknown) => createAppointment(data))
export const useUpdateAppointment  = () => useAppointmentMutation((id: string, data: unknown) => updateAppointment(id, data))
export const useCheckIn            = () => useAppointmentMutation((id: string) => checkInAppointment(id))
export const useStartAppointment   = () => useAppointmentMutation((id: string) => startAppointment(id))
export const useCompleteAppointment= () => useAppointmentMutation((id: string) => completeAppointment(id))
export const useMarkNoShow         = () => useAppointmentMutation((id: string) => markNoShow(id))
export const useConfirmAppointment = () => useAppointmentMutation((id: string) => confirmAppointment(id))
export const useReschedule         = () => useAppointmentMutation((id: string, data: unknown) => rescheduleAppointment(id, data))
export const useCancelAppointment  = () => useAppointmentMutation((id: string, data: unknown) => cancelAppointment(id, data))
export const useDeleteAppointment  = () => useAppointmentMutation((id: string) => deleteAppointment(id))
