'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Mail, MessageSquare, Phone, Bell, Smartphone, Edit, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  toggleNotificationTemplate,
} from '@/features/settings/actions'
import { notificationTemplateSchema, type NotificationTemplateInput } from '@/lib/validations/settings'
import { useNotificationTemplates } from '@/features/settings/hooks'
import type { NotificationTemplate } from '@/types/settings'

const CHANNELS = [
  { value: 'email',    label: 'Email',     icon: Mail },
  { value: 'sms',      label: 'SMS',       icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp',  icon: MessageSquare },
  { value: 'push',     label: 'Push',      icon: Bell },
  { value: 'in_app',   label: 'In-App',    icon: Smartphone },
]

const EVENTS = [
  'appointment_reminder',
  'appointment_confirmed',
  'appointment_cancelled',
  'payment_due',
  'payment_received',
  'prescription_ready',
  'lab_result_ready',
  'radiology_result_ready',
  'follow_up_reminder',
  'birthday_greeting',
  'custom',
]

const CHANNEL_COLORS: Record<string, string> = {
  email:    'text-blue-300 bg-blue-500/10',
  sms:      'text-amber-300 bg-amber-500/10',
  whatsapp: 'text-emerald-300 bg-emerald-500/10',
  push:     'text-purple-300 bg-purple-500/10',
  in_app:   'text-cyan-300 bg-cyan-500/10',
}

interface Props { initialTemplates: NotificationTemplate[] }

export function NotificationsClient({ initialTemplates }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [editTemplate, setEditTemplate] = useState<NotificationTemplate | null>(null)
  const [filterChannel, setFilterChannel] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  const { data: templates = initialTemplates } = useNotificationTemplates()

  const filtered = filterChannel === 'all'
    ? templates
    : templates.filter((t) => t.channel === filterChannel)

  function handleToggle(t: NotificationTemplate) {
    startTransition(async () => {
      await toggleNotificationTemplate(t.id, !t.is_active)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return
    startTransition(async () => {
      await deleteNotificationTemplate(id)
    })
  }

  return (
    <div className="space-y-5">
      {/* Filters + Add */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterChannel('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
              filterChannel === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white/[0.04] text-[#A1A8B8] hover:bg-white/[0.08]'
            )}
          >
            All
          </button>
          {CHANNELS.map((ch) => (
            <button
              key={ch.value}
              onClick={() => setFilterChannel(ch.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
                filterChannel === ch.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/[0.04] text-[#A1A8B8] hover:bg-white/[0.08]'
              )}
            >
              {ch.label}
            </button>
          ))}
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white text-[13px]"
        >
          <Plus size={14} />
          Add Template
        </Button>
      </div>

      {/* Template cards */}
      <div className="space-y-2">
        {filtered.map((t) => {
          const ch = CHANNELS.find((c) => c.value === t.channel)
          const Icon = ch?.icon ?? Bell
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-start gap-4 p-4 rounded-xl border transition-colors',
                t.is_active
                  ? 'border-white/[0.06] bg-white/[0.02]'
                  : 'border-white/[0.03] bg-white/[0.01] opacity-60'
              )}
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', CHANNEL_COLORS[t.channel])}>
                <Icon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white text-[13px] font-medium">{t.name}</p>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', CHANNEL_COLORS[t.channel])}>
                    {ch?.label}
                  </span>
                </div>
                <p className="text-[#A1A8B8] text-[11px] mb-1">
                  Event: <span className="text-white/70">{t.event.replace(/_/g, ' ')}</span>
                </p>
                {t.subject && (
                  <p className="text-[#A1A8B8] text-[11px]">
                    Subject: <span className="text-white/70">{t.subject}</span>
                  </p>
                )}
                <p className="text-[#A1A8B8] text-[11px] mt-1 line-clamp-2">{t.body}</p>
                {t.variables && t.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.variables.map((v) => (
                      <span key={v} className="text-[10px] bg-white/[0.05] text-[#A1A8B8] px-1.5 py-0.5 rounded font-mono">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(t)}
                  disabled={isPending}
                  className={cn('transition-colors', t.is_active ? 'text-emerald-400' : 'text-[#A1A8B8]')}
                >
                  {t.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button
                  onClick={() => setEditTemplate(t)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[#A1A8B8] hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Edit size={13} />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={isPending}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[#A1A8B8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-white/[0.06] py-16 text-center text-[#A1A8B8] text-[13px]">
            No templates found
          </div>
        )}
      </div>

      <TemplateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
      {editTemplate && (
        <TemplateDialog
          open={!!editTemplate}
          template={editTemplate}
          onClose={() => setEditTemplate(null)}
        />
      )}
    </div>
  )
}

function TemplateDialog({
  open,
  template,
  onClose,
}: {
  open: boolean
  template?: NotificationTemplate
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!template

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<NotificationTemplateInput>({
    resolver: zodResolver(notificationTemplateSchema),
    defaultValues: template
      ? {
          name: template.name,
          channel: template.channel,
          event: template.event,
          subject: template.subject ?? '',
          body: template.body,
          body_ar: template.body_ar ?? '',
          variables: template.variables ?? [],
          is_active: template.is_active,
        }
      : { is_active: true },
  })

  const channel = watch('channel')

  function onSubmit(data: NotificationTemplateInput) {
    setError(null)
    startTransition(async () => {
      const result = isEdit
        ? await updateNotificationTemplate(template.id, data)
        : await createNotificationTemplate(data)

      if (result.success) {
        reset()
        onClose()
      } else {
        setError(result.error ?? 'Failed to save')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Template' : 'New Template'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-[12px] text-[#A1A8B8]">Template Name</Label>
            <Input {...register('name')} placeholder="Appointment Reminder" className={inputCls} />
            {errors.name && <p className="text-[11px] text-red-400">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[12px] text-[#A1A8B8]">Channel</Label>
              <Select
                defaultValue={template?.channel}
                onValueChange={(v) => setValue('channel', v as NotificationTemplateInput['channel'])}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.channel && <p className="text-[11px] text-red-400">{errors.channel.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] text-[#A1A8B8]">Event</Label>
              <Select
                defaultValue={template?.event}
                onValueChange={(v) => setValue('event', v)}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {EVENTS.map((e) => (
                    <SelectItem key={e} value={e}>{e.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.event && <p className="text-[11px] text-red-400">{errors.event.message}</p>}
            </div>
          </div>
          {channel === 'email' && (
            <div className="space-y-1">
              <Label className="text-[12px] text-[#A1A8B8]">Subject</Label>
              <Input {...register('subject')} placeholder="Appointment Reminder — {{date}}" className={inputCls} />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-[12px] text-[#A1A8B8]">Body (EN)</Label>
            <Textarea
              {...register('body')}
              rows={4}
              placeholder="Dear {{patient_name}}, your appointment is on {{date}} at {{time}}."
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-[#A1A8B8]/50 focus:border-blue-500/50 text-[13px] resize-none"
            />
            {errors.body && <p className="text-[11px] text-red-400">{errors.body.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] text-[#A1A8B8]">Body (AR)</Label>
            <Textarea
              {...register('body_ar')}
              rows={3}
              dir="rtl"
              placeholder="عزيزي {{patient_name}}، موعدك يوم {{date}} الساعة {{time}}."
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-[#A1A8B8]/50 focus:border-blue-500/50 text-[13px] resize-none"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] text-[#A1A8B8]">Variables (comma-separated)</Label>
            <Input
              defaultValue={template?.variables?.join(', ') ?? ''}
              onChange={(e) =>
                setValue(
                  'variables',
                  e.target.value.split(',').map((v) => v.trim()).filter(Boolean)
                )
              }
              placeholder="{{patient_name}}, {{date}}, {{time}}"
              className={inputCls}
            />
          </div>
          {error && <p className="text-[13px] text-red-400">{error}</p>}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/[0.08]">Cancel</Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const inputCls = 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-[#A1A8B8]/50 focus:border-blue-500/50 h-9 text-[13px]'
