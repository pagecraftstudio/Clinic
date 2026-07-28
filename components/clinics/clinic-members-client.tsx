'use client'

import { useState } from 'react'
import { Mail, Trash2, Shield, UserPlus, Clock, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  useClinicUsers, useClinicInvitations, useInviteUser,
  useRevokeInvitation, useRemoveClinicUser, useUpdateClinicUserRole,
} from '@/features/clinics/hooks'

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'lab_technician', label: 'Lab Technician' },
  { value: 'radiology_technician', label: 'Radiology Tech' },
  { value: 'pharmacist', label: 'Pharmacist' },
]

interface Props {
  clinicId: string
  currentUserId: string
}

export function ClinicMembersClient({ clinicId, currentUserId }: Props) {
  const { data: members = [] } = useClinicUsers(clinicId)
  const { data: invitations = [] } = useClinicInvitations(clinicId)
  const inviteMut = useInviteUser(clinicId)
  const revokeMut = useRevokeInvitation(clinicId)
  const removeMut = useRemoveClinicUser(clinicId)
  const updateRoleMut = useUpdateClinicUserRole(clinicId)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('receptionist')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  function handleInvite() {
    inviteMut.mutate({ email, role }, {
      onSuccess: () => { setInviteOpen(false); setEmail(''); setRole('receptionist') },
    })
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team members</CardTitle>
            <CardDescription>{members.length} member{members.length !== 1 ? 's' : ''}</CardDescription>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite team member</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleInvite} disabled={!email || inviteMut.isPending}>
                  Send invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {(members as any[]).map(m => {
              const profile = m.profiles
              const isSelf = m.user_id === currentUserId
              return (
                <div key={m.id} className="flex items-center gap-3 py-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>{profile?.display_name?.[0] ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile?.display_name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                  <Select
                    value={m.role}
                    onValueChange={v => updateRoleMut.mutate({ userId: m.user_id, role: v })}
                    disabled={isSelf || m.role === 'owner'}
                  >
                    <SelectTrigger className="w-36 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {m.role === 'owner'
                        ? <SelectItem value="owner">Owner</SelectItem>
                        : ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                  {!isSelf && m.role !== 'owner' && (
                    <ConfirmDialog
                      title="Remove member?"
                      description={`This will remove ${profile?.display_name} from this clinic.`}
                      onConfirm={() => removeMut.mutate(m.user_id)}
                    >
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </ConfirmDialog>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {(invitations as any[]).map(inv => (
                <div key={inv.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {inv.role.replace('_', ' ')} · expires {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7"
                    onClick={() => copyInviteLink(inv.token)}
                  >
                    {copiedToken === inv.token
                      ? <Check className="h-3.5 w-3.5 text-green-500" />
                      : <Copy className="h-3.5 w-3.5" />
                    }
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => revokeMut.mutate(inv.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
