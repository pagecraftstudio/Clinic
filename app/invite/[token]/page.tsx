import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInvitationByToken } from '@/features/clinics/queries'
import { AcceptInviteClient } from './accept-invite-client'

interface Props { params: Promise<{ token: string }> }

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const invitation = await getInvitationByToken(token)

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Invitation expired or invalid</h1>
          <p className="text-muted-foreground">Ask your admin to send a new invitation.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <AcceptInviteClient
        token={token}
        clinicName={invitation.clinics.name}
        clinicLogo={invitation.clinics.logo_url}
        role={invitation.role}
        isLoggedIn={!!user}
        userEmail={user?.email}
      />
    </div>
  )
}
