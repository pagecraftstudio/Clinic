import { createClient } from '@/lib/supabase/server'
import { requireActiveClinicId } from '@/lib/clinic-context'
import { ClinicMembersClient } from '@/components/clinics/clinic-members-client'

export const metadata = { title: 'Team Members' }

export default async function UsersPage() {
  const [supabase, clinicId] = await Promise.all([createClient(), requireActiveClinicId()])
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Team members</h1>
        <p className="text-muted-foreground text-sm">Manage who has access to this clinic</p>
      </div>
      <ClinicMembersClient clinicId={clinicId} currentUserId={user?.id ?? ''} />
    </div>
  )
}
