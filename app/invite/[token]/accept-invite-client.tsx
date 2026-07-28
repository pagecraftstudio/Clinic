'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { acceptInvitation } from '@/features/clinics/actions'
import { toast } from 'sonner'

interface Props {
  token: string
  clinicName: string
  clinicLogo: string | null
  role: string
  isLoggedIn: boolean
  userEmail?: string
}

export function AcceptInviteClient({ token, clinicName, clinicLogo, role, isLoggedIn, userEmail }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAccept() {
    if (!isLoggedIn) { router.push(`/login?redirect=/invite/${token}`); return }
    setError(null)
    startTransition(async () => {
      const res = await acceptInvitation(token)
      if (!res.success) { setError(res.error ?? 'Error'); return }
      toast.success(`Joined ${clinicName}!`)
      router.push('/')
    })
  }

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto mb-3">
          <Avatar className="h-16 w-16 mx-auto">
            <AvatarImage src={clinicLogo ?? undefined} />
            <AvatarFallback className="text-lg"><Building2 className="h-7 w-7" /></AvatarFallback>
          </Avatar>
        </div>
        <CardTitle>You've been invited</CardTitle>
        <CardDescription>
          Join <strong>{clinicName}</strong> as <strong className="capitalize">{role.replace('_', ' ')}</strong>
          {userEmail && <><br /><span className="text-xs">Logged in as {userEmail}</span></>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" onClick={handleAccept} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isLoggedIn ? 'Accept invitation' : 'Log in to accept'}
        </Button>
      </CardContent>
    </Card>
  )
}
