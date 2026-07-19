import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsNav } from '@/components/settings/settings-nav'
import type { ReactNode } from 'react'

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin'
  if (!isAdmin) redirect('/')

  return (
    <div className="flex flex-col gap-0 min-h-full">
      <div className="px-6 pt-6 pb-0 border-b border-white/[0.06]">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-white tracking-tight">Settings</h1>
          <p className="text-sm text-[#A1A8B8] mt-0.5">Manage clinic configuration, users, and preferences</p>
        </div>
        <SettingsNav />
      </div>
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  )
}
