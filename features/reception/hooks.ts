'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { Appointment } from '@/types/appointment'

const APPOINTMENT_SELECT = `
  *,
  patients ( id, full_name, patient_number, phone, gender, date_of_birth ),
  doctors ( id, specialty, profiles ( first_name, last_name, display_name, avatar_url ) )
`

export function useTodayAppointments() {
  const today = format(new Date(), 'yyyy-MM-dd')
  return useQuery({
    queryKey: ['reception-today', today],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('appointments')
        .select(APPOINTMENT_SELECT)
        .is('deleted_at', null)
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`)
        .order('scheduled_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Appointment[]
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export function useReceptionStats() {
  const today = format(new Date(), 'yyyy-MM-dd')
  return useQuery({
    queryKey: ['reception-stats', today],
    queryFn: async () => {
      const supabase = createClient()

      const [apptRes, patientRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('status')
          .is('deleted_at', null)
          .gte('scheduled_at', `${today}T00:00:00`)
          .lte('scheduled_at', `${today}T23:59:59`),
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null)
          .gte('created_at', `${today}T00:00:00`),
      ])

      const appts = apptRes.data ?? []
      return {
        total:       appts.length,
        scheduled:   appts.filter(a => a.status === 'scheduled').length,
        confirmed:   appts.filter(a => a.status === 'confirmed').length,
        checked_in:  appts.filter(a => a.status === 'checked_in').length,
        in_progress: appts.filter(a => a.status === 'in_progress').length,
        completed:   appts.filter(a => a.status === 'completed').length,
        cancelled:   appts.filter(a => a.status === 'cancelled').length,
        no_show:     appts.filter(a => a.status === 'no_show').length,
        new_patients: patientRes.count ?? 0,
      }
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export function useWaitingQueue() {
  const today = format(new Date(), 'yyyy-MM-dd')
  return useQuery({
    queryKey: ['reception-queue', today],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('appointments')
        .select(APPOINTMENT_SELECT)
        .is('deleted_at', null)
        .in('status', ['checked_in', 'in_progress'])
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`)
        .order('checked_in_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Appointment[]
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  })
}
