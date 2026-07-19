'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import type { UserRole } from '@/types/database'

export function useAuth() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

export function useProfile() {
  const { user } = useAuth()
  const supabase  = createClient()

  return useQuery({
    queryKey: ['profile', user?.id],
    enabled:  !!user?.id,
    queryFn:  async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()
      return data
    },
  })
}

export function useRole() {
  const { data: profile } = useProfile()
  const role = profile?.role as UserRole | undefined

  return {
    role,
    isOwner:     role === 'owner',
    isAdmin:     role === 'admin' || role === 'owner',
    isDoctor:    role === 'doctor',
    isNurse:     role === 'nurse',
    isReception: role === 'receptionist',
    isCashier:   role === 'cashier',
    isPatient:   role === 'patient',
    isClinical:  ['owner','admin','doctor','nurse','receptionist','lab_technician','radiology_technician','pharmacist'].includes(role ?? ''),
  }
}
