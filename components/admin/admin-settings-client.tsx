'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { setMaintenanceMode } from '@/features/admin/actions'
import type { MaintenanceModeValue } from '@/types/admin'

export function AdminSettingsClient({ initial }: { initial: MaintenanceModeValue }) {
  const [enabled, setEnabled] = useState(initial.enabled)
  const [message, setMessage] = useState(initial.message)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await setMaintenanceMode({ enabled, message })
    setSaving(false)
    if (!res.success) return toast.error(res.error ?? 'Failed to save')
    toast.success('Maintenance mode updated')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Maintenance mode</CardTitle>
        <CardDescription>When enabled, clinic staff see a maintenance banner. Use for planned downtime.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Enabled</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="We're performing scheduled maintenance and will be back shortly."
          rows={3}
        />
        <div className="flex justify-end">
          <Button size="sm" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
