'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  ClinicSettings, Holiday, NotificationTemplate, StaffUser,
  Permission, HolidayInput, NotificationTemplateInput,
  CreateUserInput, UpdateUserInput,
} from '@/types/settings'

const supabase = createClient()

// ── Clinic Settings ───────────────────────────────────────────────────────────

export function useClinicSettings() {
  return useQuery<ClinicSettings | null>({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .limit(1)
        .single()
      if (error) return null
      return data as ClinicSettings
    },
  })
}

// ── Holidays ──────────────────────────────────────────────────────────────────

export function useHolidays() {
  return useQuery<Holiday[]>({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true })
      if (error) throw error
      return (data ?? []) as Holiday[]
    },
  })
}

export function useCreateHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: HolidayInput) => {
      const { data, error } = await supabase
        .from('holidays')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  })
}

export function useUpdateHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<HolidayInput> }) => {
      const { error } = await supabase.from('holidays').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  })
}

export function useDeleteHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('holidays').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  })
}

// ── Notification Templates ────────────────────────────────────────────────────

export function useNotificationTemplates() {
  return useQuery<NotificationTemplate[]>({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('channel', { ascending: true })
      if (error) throw error
      return (data ?? []) as NotificationTemplate[]
    },
  })
}

export function useToggleNotificationTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('notification_templates')
        .update({ is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-templates'] }),
  })
}

export function useDeleteNotificationTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notification_templates').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-templates'] }),
  })
}

// ── Staff Users ───────────────────────────────────────────────────────────────

export function useStaffUsers() {
  return useQuery<StaffUser[]>({
    queryKey: ['staff-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('role', 'eq', 'patient')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as StaffUser[]
    },
  })
}

export function useToggleUserActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-users'] }),
  })
}

// ── Permissions ───────────────────────────────────────────────────────────────

export function usePermissions() {
  return useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true })
      if (error) throw error
      return (data ?? []) as Permission[]
    },
  })
}

export function useRolePermissions() {
  return useQuery<{ role: string; permission_id: string }[]>({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_permissions').select('*')
      if (error) throw error
      return (data ?? []) as { role: string; permission_id: string }[]
    },
  })
}
