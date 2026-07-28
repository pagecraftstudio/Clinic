'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { switchClinic, inviteUser, revokeInvitation, removeClinicUser, updateClinicUserRole } from './actions'
import { toast } from 'sonner'

export function useUserClinics() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['user-clinics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase
        .from('clinic_users')
        .select('role, is_active, clinics(id, slug, name, name_ar, logo_url)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: true })
      return data ?? []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useClinicUsers(clinicId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['clinic-users', clinicId],
    queryFn: async () => {
      const { data } = await supabase
        .from('clinic_users')
        .select('*, profiles(id, first_name, last_name, display_name, email, avatar_url, role, is_active)')
        .eq('clinic_id', clinicId)
        .order('joined_at', { ascending: true })
      return data ?? []
    },
    enabled: !!clinicId,
  })
}

export function useClinicInvitations(clinicId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['clinic-invitations', clinicId],
    queryFn: async () => {
      const { data } = await supabase
        .from('clinic_invitations')
        .select('*')
        .eq('clinic_id', clinicId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      return data ?? []
    },
    enabled: !!clinicId,
  })
}

export function useSwitchClinic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (clinicId: string) => switchClinic(clinicId),
    onSuccess: () => {
      qc.clear()
      window.location.reload()
    },
    onError: () => toast.error('Failed to switch clinic'),
  })
}

export function useInviteUser(clinicId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { email: string; role: string }) => inviteUser(clinicId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-invitations', clinicId] })
      toast.success('Invitation sent')
    },
    onError: () => toast.error('Failed to send invitation'),
  })
}

export function useRevokeInvitation(clinicId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-invitations', clinicId] })
      toast.success('Invitation revoked')
    },
  })
}

export function useRemoveClinicUser(clinicId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => removeClinicUser(clinicId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-users', clinicId] })
      toast.success('User removed')
    },
  })
}

export function useUpdateClinicUserRole(clinicId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateClinicUserRole(clinicId, userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-users', clinicId] })
      toast.success('Role updated')
    },
  })
}
