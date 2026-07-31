'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Ban, CheckCircle2, StickyNote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { suspendClinic, unsuspendClinic, updateClinicInternalNotes } from '@/features/admin/actions'
import type { AdminClinicRow } from '@/types/admin'

export function AdminClinicsClient({ clinics }: { clinics: AdminClinicRow[] }) {
  const [suspendTarget, setSuspendTarget] = useState<AdminClinicRow | null>(null)
  const [reason, setReason] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notesOpenId, setNotesOpenId] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState('')

  async function handleSuspend() {
    if (!suspendTarget) return
    setBusyId(suspendTarget.id)
    const res = await suspendClinic(suspendTarget.id, { reason })
    setBusyId(null)
    if (!res.success) return toast.error(res.error ?? 'Failed to suspend')
    toast.success(`${suspendTarget.name} suspended`)
    setSuspendTarget(null)
    setReason('')
  }

  async function handleUnsuspend(c: AdminClinicRow) {
    setBusyId(c.id)
    const res = await unsuspendClinic(c.id)
    setBusyId(null)
    if (!res.success) return toast.error(res.error ?? 'Failed to reactivate')
    toast.success(`${c.name} reactivated`)
  }

  async function handleSaveNotes(id: string) {
    setBusyId(id)
    const res = await updateClinicInternalNotes(id, notesDraft)
    setBusyId(null)
    if (!res.success) return toast.error(res.error ?? 'Failed to save notes')
    toast.success('Notes saved')
    setNotesOpenId(null)
  }

  return (
    <div className="space-y-3">
      {clinics.map((c) => (
        <Card key={c.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{c.name}</p>
                  <Badge variant={c.suspended_at ? 'destructive' : 'secondary'}>
                    {c.suspended_at ? 'Suspended' : 'Active'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  /{c.slug} · {c.owner_email ?? 'no owner'} · {c.city ?? c.country}
                </p>
                {c.suspended_reason && (
                  <p className="text-xs text-red-500 mt-1">Reason: {c.suspended_reason}</p>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                <span>{c.user_count} users</span>
                <span>{c.patient_count} patients</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNotesOpenId(notesOpenId === c.id ? null : c.id)
                    setNotesDraft(c.internal_notes ?? '')
                  }}
                >
                  <StickyNote size={14} className="mr-1.5" /> Notes
                </Button>
                {c.suspended_at ? (
                  <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => handleUnsuspend(c)}>
                    <CheckCircle2 size={14} className="mr-1.5" /> Reactivate
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" disabled={busyId === c.id} onClick={() => setSuspendTarget(c)}>
                    <Ban size={14} className="mr-1.5" /> Suspend
                  </Button>
                )}
              </div>
            </div>

            {notesOpenId === c.id && (
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <Textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Internal support notes (not visible to the clinic)"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setNotesOpenId(null)}>Cancel</Button>
                  <Button size="sm" disabled={busyId === c.id} onClick={() => handleSaveNotes(c.id)}>Save</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {clinics.length === 0 && (
        <p className="text-sm text-center text-muted-foreground py-8">No clinics yet.</p>
      )}

      <Dialog open={!!suspendTarget} onOpenChange={(v) => { if (!v) { setSuspendTarget(null); setReason('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {suspendTarget?.name}?</DialogTitle>
            <DialogDescription>Staff at this clinic lose access immediately. Reversible.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (shown in clinic list, not to the clinic)"
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setSuspendTarget(null); setReason('') }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || busyId === suspendTarget?.id}
              onClick={handleSuspend}
            >
              {busyId === suspendTarget?.id ? 'Suspending…' : 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
