'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, AlertTriangle, Info, AlertOctagon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createAnnouncement, toggleAnnouncement, deleteAnnouncement } from '@/features/admin/actions'
import type { SystemAnnouncement, AnnouncementSeverity } from '@/types/admin'

const SEVERITY_ICON: Record<AnnouncementSeverity, any> = { info: Info, warning: AlertTriangle, critical: AlertOctagon }
const SEVERITY_COLOR: Record<AnnouncementSeverity, string> = {
  info: 'text-blue-500', warning: 'text-amber-500', critical: 'text-red-500',
}

export function AdminAnnouncementsClient({ announcements }: { announcements: SystemAnnouncement[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<AnnouncementSeverity>('info')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleCreate() {
    setSaving(true)
    const res = await createAnnouncement({ title, message, severity })
    setSaving(false)
    if (!res.success) return toast.error(res.error ?? 'Failed to create')
    toast.success('Announcement published')
    setCreateOpen(false)
    setTitle(''); setMessage(''); setSeverity('info')
  }

  async function handleToggle(a: SystemAnnouncement) {
    setBusyId(a.id)
    const res = await toggleAnnouncement(a.id, !a.is_active)
    setBusyId(null)
    if (!res.success) return toast.error(res.error ?? 'Failed to update')
  }

  async function handleDelete(a: SystemAnnouncement) {
    setBusyId(a.id)
    const res = await deleteAnnouncement(a.id)
    setBusyId(null)
    if (!res.success) return toast.error(res.error ?? 'Failed to delete')
    toast.success('Announcement deleted')
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} className="mr-1.5" /> New announcement
        </Button>
      </div>

      {announcements.map((a) => {
        const Icon = SEVERITY_ICON[a.severity]
        return (
          <Card key={a.id}>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <Icon size={18} className={`${SEVERITY_COLOR[a.severity]} mt-0.5 flex-shrink-0`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{a.title}</p>
                    <Badge variant="outline" className="capitalize">{a.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Switch checked={a.is_active} disabled={busyId === a.id} onCheckedChange={() => handleToggle(a)} />
                <Button size="sm" variant="ghost" disabled={busyId === a.id} onClick={() => handleDelete(a)}>
                  <Trash2 size={14} className="text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {announcements.length === 0 && (
        <p className="text-sm text-center text-muted-foreground py-8">No announcements yet.</p>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New announcement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scheduled maintenance" />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as AnnouncementSeverity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={!title.trim() || !message.trim() || saving} onClick={handleCreate}>
              {saving ? 'Publishing…' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
