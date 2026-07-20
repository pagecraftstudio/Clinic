'use client'

import { useState, useTransition, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Upload, Building2, Clock, Globe, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { updateClinicSettings, uploadClinicLogo } from '@/features/settings/actions'
import { clinicSettingsSchema, type ClinicSettingsInput } from '@/lib/validations/settings'
import type { ClinicSettings } from '@/types/settings'

interface Props {
  settings: ClinicSettings | null
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TIMEZONES = [
  'Africa/Cairo', 'Asia/Dubai', 'Asia/Riyadh', 'Europe/London',
  'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo',
]

const CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR']

export function ClinicSettingsClient({ settings }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [logoUrl, setLogoUrl] = useState(settings?.logo_url ?? null)
  const [logoUploading, setLogoUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClinicSettingsInput>({
    resolver: zodResolver(clinicSettingsSchema),
    defaultValues: {
      name: settings?.name ?? '',
      name_ar: settings?.name_ar ?? '',
      tagline: settings?.tagline ?? '',
      tagline_ar: settings?.tagline_ar ?? '',
      phone: settings?.phone ?? '',
      phone_alt: settings?.phone_alt ?? '',
      email: settings?.email ?? '',
      address: settings?.address ?? '',
      address_ar: settings?.address_ar ?? '',
      city: settings?.city ?? '',
      country: settings?.country ?? 'EG',
      tax_number: settings?.tax_number ?? '',
      license_number: settings?.license_number ?? '',
      currency: settings?.currency ?? 'EGP',
      timezone: settings?.timezone ?? 'Africa/Cairo',
      date_format: settings?.date_format ?? 'DD/MM/YYYY',
      time_format: (settings?.time_format as '12h' | '24h') ?? '12h',
      working_days: settings?.working_days ?? [0, 1, 2, 3, 4],
      working_hours_start: settings?.working_hours_start ?? '08:00',
      working_hours_end: settings?.working_hours_end ?? '20:00',
      appointment_duration: settings?.appointment_duration ?? 30,
      primary_color: settings?.primary_color ?? '#0066FF',
      invoice_prefix: settings?.invoice_prefix ?? 'INV',
      invoice_notes: settings?.invoice_notes ?? '',
      invoice_footer: settings?.invoice_footer ?? '',
    },
  })

  const workingDays = watch('working_days') ?? []

  function toggleDay(day: number) {
    const current = workingDays
    if (current.includes(day)) {
      setValue('working_days', current.filter((d) => d !== day))
    } else {
      setValue('working_days', [...current, day].sort())
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const fd = new FormData()
    fd.append('logo', file)
    const result = await uploadClinicLogo(fd)
    setLogoUploading(false)
    if (result.success && result.data) setLogoUrl(result.data.logo_url)
  }

  function onSubmit(data: ClinicSettingsInput) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateClinicSettings(data)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error ?? 'Failed to save')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
      {/* Logo */}
      <Section icon={Building2} title="Clinic Identity">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 size={28} className="text-[var(--text-muted)]" />
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={logoUploading}
              className="mt-2 w-20 flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Upload size={11} />
              {logoUploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <Field label="Clinic Name (EN)" error={errors.name?.message}>
              <Input {...register('name')} placeholder="My Clinic" className={inputCls} />
            </Field>
            <Field label="Clinic Name (AR)">
              <Input {...register('name_ar')} placeholder="عيادتي" dir="rtl" className={inputCls} />
            </Field>
            <Field label="Tagline (EN)">
              <Input {...register('tagline')} placeholder="Your health, our priority" className={inputCls} />
            </Field>
            <Field label="Tagline (AR)">
              <Input {...register('tagline_ar')} placeholder="صحتك أولويتنا" dir="rtl" className={inputCls} />
            </Field>
          </div>
        </div>
      </Section>

      {/* Contact */}
      <Section icon={Globe} title="Contact & Location">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <Input {...register('phone')} placeholder="+20 100 000 0000" className={inputCls} />
          </Field>
          <Field label="Alt Phone">
            <Input {...register('phone_alt')} placeholder="+20 100 000 0001" className={inputCls} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input {...register('email')} type="email" placeholder="clinic@example.com" className={inputCls} />
          </Field>
          <Field label="City">
            <Input {...register('city')} placeholder="Cairo" className={inputCls} />
          </Field>
          <Field label="Address (EN)" className="col-span-2">
            <Input {...register('address')} placeholder="123 Street, District" className={inputCls} />
          </Field>
          <Field label="Address (AR)" className="col-span-2">
            <Input {...register('address_ar')} placeholder="١٢٣ شارع المنطقة" dir="rtl" className={inputCls} />
          </Field>
          <Field label="Tax Number">
            <Input {...register('tax_number')} placeholder="Tax registration number" className={inputCls} />
          </Field>
          <Field label="License Number">
            <Input {...register('license_number')} placeholder="Medical license number" className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Regional */}
      <Section icon={Globe} title="Regional">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Currency">
            <Select defaultValue={settings?.currency ?? 'EGP'} onValueChange={(v) => setValue('currency', v)}>
              <SelectTrigger className={inputCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Timezone">
            <Select defaultValue={settings?.timezone ?? 'Africa/Cairo'} onValueChange={(v) => setValue('timezone', v)}>
              <SelectTrigger className={inputCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date Format">
            <Select defaultValue={settings?.date_format ?? 'DD/MM/YYYY'} onValueChange={(v) => setValue('date_format', v)}>
              <SelectTrigger className={inputCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Time Format">
            <Select defaultValue={settings?.time_format ?? '12h'} onValueChange={(v) => setValue('time_format', v as '12h' | '24h')}>
              <SelectTrigger className={inputCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {/* Working Hours */}
      <Section icon={Clock} title="Working Hours">
        <div className="space-y-4">
          <div>
            <Label className="text-[12px] text-[var(--text-muted)] mb-2 block">Working Days</Label>
            <div className="flex gap-2">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={cn(
                    'w-10 h-10 rounded-lg text-[12px] font-medium transition-colors',
                    workingDays.includes(i)
                      ? 'bg-blue-600 text-white'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]'
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Start Time">
              <Input {...register('working_hours_start')} type="time" className={inputCls} />
            </Field>
            <Field label="End Time">
              <Input {...register('working_hours_end')} type="time" className={inputCls} />
            </Field>
            <Field label="Appointment Duration (min)" error={errors.appointment_duration?.message}>
              <Input {...register('appointment_duration', { valueAsNumber: true })} type="number" min={5} max={180} step={5} className={inputCls} />
            </Field>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section icon={Palette} title="Appearance">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Primary Color">
            <div className="flex gap-2 items-center">
              <input
                {...register('primary_color')}
                type="color"
                className="w-10 h-10 rounded-lg border border-[var(--border)] cursor-pointer bg-transparent"
              />
              <Input {...register('primary_color')} placeholder="#0066FF" className={cn(inputCls, 'flex-1')} />
            </div>
          </Field>
        </div>
      </Section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 {
        >
          <Save size={14} />
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
        {success && <span className="text-[13px] text-emerald-400">Saved successfully</span>}
        {error && <span className="text-[13px] text-red-400">{error}</span>}
      </div>
    </form>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls = 'bg-[var(--bg-subtle)] border-[var(--border)] text-white placeholder:text-[var(--text-muted)]/50 focus:border-blue-500/50 h-9 text-[13px]'

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-[var(--text-muted)]" />
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-[12px] text-[var(--text-muted)]">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  )
}
