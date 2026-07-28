import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateClinicClient } from './create-clinic-client'

export const metadata = { title: 'Create Clinic' }

export default async function CreateClinicPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <CreateClinicClient />
    </div>
  )
}
