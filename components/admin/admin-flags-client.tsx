'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { upsertFeatureFlag, toggleFeatureFlag, deleteFeatureFlag } from '@/features/admin/actions'
import type { FeatureFlag } from '@/types/admin'

export function AdminFlagsClient({ flags }: { flags: FeatureFlag[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleCreate() {
    setSaving(true)
    const res = await upsertFeatureFlag({ key, name, description, is_enabled: false, rollout_percent: 100 })
    setSaving(false)
    if (!res.success) return toast.error(res.error ?? 'Failed to create flag')
    toast.success('Flag created')
    setCreateOpen(false)
    setKey(''); setName(''); setDescription('')
  }

  async function handleToggle(flag: FeatureFlag) {
    setBusyId(flag.id)
    const res = await toggleFeatureFlag(flag.id, !flag.is_enabled)
    setBusyId(null)
    if (!res.success) return toast.error(res.error ?? 'Failed to toggle')
  }

  async function handleDelete(flag: FeatureFlag) {
    setBusyId(flag.id)
    const res = await deleteFeatureFlag(flag.id)
    setBusyId(null)
    if (!res.success) return toast.error(res.error ?? 'Failed to delete')
    toast.success('Flag deleted')
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} className="mr-1.5" /> New flag
        </Button>
      </div>

      {flags.map((f) => (
        <Card key={f.id}>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm font-mono">{f.key}</p>
              <p className="text-xs text-muted-foreground">{f.name}{f.description ? ` — ${f.description}` : ''}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{f.rollout_percent}% rollout · {f.clinic_id ? 'clinic-scoped' : 'global'}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Switch checked={f.is_enabled} disabled={busyId === f.id} onCheckedChange={() => handleToggle(f)} />
              <Button size="sm" variant="ghost" disabled={busyId === f.id} onClick={() => handleDelete(f)}>
                <Trash2 size={14} className="text-red-500" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {flags.length === 0 && (
        <p className="text-sm text-center text-muted-foreground py-8">No feature flags yet.</p>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New feature flag</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Key</Label>
              <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="online_booking_v2" />
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Online Booking v2" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={!key.trim() || !name.trim() || saving} onClick={handleCreate}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
