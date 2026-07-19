'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { doctorSchema, type DoctorSchema } from '@/lib/validations/doctor'
import { createDoctor, updateDoctor } from '@/features/doctors/actions'
import type { Doctor, WorkingHours, DayOfWeek } from '@/types/doctor'
import { cn } from '@/lib/utils'
import { Loader2, User, Stethoscope, DollarSign, Clock, Globe, FileText } from 'lucide-react'

interface Props {
  doctor?: Doctor
  onSuccess?: (id: string) => void
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday',    label: 'Monday' },
  { key: 'tuesday',   label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday',  label: 'Thursday' },
  { key: 'friday',    label: 'Friday' },
  { key: 'saturday',  label: 'Saturday' },
  { key: 'sunday',    label: 'Sunday' },
]

const DEFAULT_WORKING_HOURS: WorkingHours[] = DAYS.map(({ key }) => ({
  day: key,
  is_active: !['saturday', 'sunday'].includes(key),
  start_time: '09:00',
  end_time: '17:00',
  break_start: '13:00',
  break_end: '14:00',
  slot_duration: 30,
}))

const SPECIALTIES = [
  'General Practice', 'Internal Medicine', 'Cardiology', 'Dermatology',
  'Endocrinology', 'ENT', 'Gastroenterology', 'Gynecology', 'Hematology',
  'Nephrology', 'Neurology', 'Obstetrics', 'Oncology', 'Ophthalmology',
  'Orthopedics', 'Pediatrics', 'Psychiatry', 'Pulmonology', 'Radiology',
  'Rheumatology', 'Surgery', 'Urology',
]

type Tab = 'profile' | 'professional' | 'schedule'

export function DoctorForm({ doctor, onSuccess }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('profile')

  const isEdit = !!doctor

  const defaultWorkingHours = (doctor?.working_hours ?? DEFAULT_WORKING_HOURS) as WorkingHours[]

  const {
    register, control, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm<DoctorSchema>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      first_name:        doctor?.profiles?.first_name ?? '',
      last_name:         doctor?.profiles?.last_name ?? '',
      display_name:      doctor?.profiles?.display_name ?? '',
      phone:             doctor?.profiles?.phone ?? '',
      email:             doctor?.profiles?.email ?? '',
      avatar_url:        doctor?.profiles?.avatar_url ?? '',
      specialty:         doctor?.specialty ?? '',
      sub_specialty:     doctor?.sub_specialty ?? '',
      license_number:    doctor?.license_number ?? '',
      consultation_fee:  doctor?.consultation_fee ?? 0,
      follow_up_fee:     doctor?.follow_up_fee ?? 0,
      bio:               doctor?.bio ?? '',
      is_active:         doctor?.is_active ?? true,
      accepts_online:    doctor?.accepts_online ?? false,
      working_hours:     defaultWorkingHours,
    },
  })

  const workingHours = watch('working_hours')

  function onSubmit(values: DoctorSchema) {
    setServerError(null)
    startTransition(async () => {
      const res = isEdit
        ? await updateDoctor(doctor.id, values)
        : await createDoctor(values)

      if (!res.success) {
        setServerError(res.error ?? 'Something went wrong')
        return
      }
      const id = isEdit ? doctor.id : (res as { data?: { id: string } }).data?.id ?? ''
      if (onSuccess) { onSuccess(id); return }
      router.push(`/doctors/${id}`)
    })
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile',      label: 'Profile',      icon: <User className="size-4" /> },
    { key: 'professional', label: 'Professional',  icon: <Stethoscope className="size-4" /> },
    { key: 'schedule',     label: 'Schedule',      icon: <Clock className="size-4" /> },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tab nav */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" error={errors.first_name?.message}>
              <input {...register('first_name')} placeholder="Ahmed" className={inputCls(!!errors.first_name)} />
            </Field>
            <Field label="Last Name" error={errors.last_name?.message}>
              <input {...register('last_name')} placeholder="Hassan" className={inputCls(!!errors.last_name)} />
            </Field>
          </div>
          <Field label="Display Name" hint="Shown to patients — defaults to Dr. First Last">
            <input {...register('display_name')} placeholder="Dr. Ahmed Hassan" className={inputCls(false)} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="doctor@clinic.com" className={inputCls(!!errors.email)} />
          </Field>
          <Field label="Phone">
            <input {...register('phone')} placeholder="+20 10 0000 0000" className={inputCls(false)} />
          </Field>
          <Field label="Avatar URL">
            <input {...register('avatar_url')} placeholder="https://…" className={inputCls(false)} />
          </Field>
          <Field label="Bio">
            <textarea
              {...register('bio')}
              rows={4}
              placeholder="Brief professional biography…"
              className={inputCls(false) + ' resize-none'}
            />
          </Field>
        </div>
      )}

      {/* ── Professional tab ────────────────────────────────────── */}
      {tab === 'professional' && (
        <div className="space-y-4">
          <Field label="Specialty" error={errors.specialty?.message}>
            <select {...register('specialty')} className={inputCls(!!errors.specialty)}>
              <option value="">Select specialty…</option>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Sub-specialty">
            <input {...register('sub_specialty')} placeholder="e.g. Interventional Cardiology" className={inputCls(false)} />
          </Field>
          <Field label="License Number">
            <input {...register('license_number')} placeholder="EG-12345" className={inputCls(false)} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Consultation Fee (EGP)" error={errors.consultation_fee?.message}>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
                <input
                  {...register('consultation_fee')}
                  type="number" min={0} step={0.01}
                  className={inputCls(!!errors.consultation_fee) + ' pl-9'}
                />
              </div>
            </Field>
            <Field label="Follow-up Fee (EGP)" error={errors.follow_up_fee?.message}>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
                <input
                  {...register('follow_up_fee')}
                  type="number" min={0} step={0.01}
                  className={inputCls(!!errors.follow_up_fee) + ' pl-9'}
                />
              </div>
            </Field>
          </div>
          {/* Toggles */}
          <div className="flex flex-col gap-3 pt-2">
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Toggle
                  label="Active"
                  hint="Inactive doctors won't appear in appointment booking"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="accepts_online"
              render={({ field }) => (
                <Toggle
                  label="Accepts Online Appointments"
                  icon={<Globe className="size-4" />}
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      )}

      {/* ── Schedule tab ─────────────────────────────────────────── */}
      {tab === 'schedule' && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-muted)]">
            Configure working days and slot duration. Break times are optional.
          </p>
          {DAYS.map((day, i) => {
            const wh = workingHours[i]
            return (
              <div
                key={day.key}
                className={cn(
                  'rounded-xl border p-4 transition-colors',
                  wh?.is_active ? 'border-[var(--border)] bg-white' : 'border-dashed border-[var(--border)] bg-[var(--surface-muted)]',
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm text-[var(--text-primary)]">{day.label}</span>
                  <Controller
                    control={control}
                    name={`working_hours.${i}.is_active`}
                    render={({ field }) => (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only" checked={field.value} onChange={field.onChange} />
                        <div className={cn(
                          'w-9 h-5 rounded-full transition-colors',
                          field.value ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
                        )}>
                          <div className={cn(
                            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                            field.value ? 'translate-x-4' : 'translate-x-0',
                          )} />
                        </div>
                      </label>
                    )}
                  />
                </div>
                {wh?.is_active && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <TimeField label="Start" name={`working_hours.${i}.start_time`} register={register} />
                    <TimeField label="End"   name={`working_hours.${i}.end_time`}   register={register} />
                    <TimeField label="Break start" name={`working_hours.${i}.break_start`} register={register} />
                    <TimeField label="Break end"   name={`working_hours.${i}.break_end`}   register={register} />
                    <div className="col-span-2 sm:col-span-4">
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Slot duration (min)</label>
                      <select
                        {...register(`working_hours.${i}.slot_duration`)}
                        className="w-full text-sm rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      >
                        {[10, 15, 20, 30, 45, 60, 90].map((v) => (
                          <option key={v} value={v}>{v} min</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{serverError}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-muted)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Add Doctor'}
        </button>
      </div>
    </form>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Field({
  label, error, hint, children,
}: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--text-primary)]">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Toggle({
  label, hint, icon, checked, onChange,
}: { label: string; hint?: string; icon?: React.ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-muted)] transition-colors">
      <div className="flex items-center gap-2">
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
          {hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
        </div>
      </div>
      <div className="relative flex-shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={cn('w-9 h-5 rounded-full transition-colors', checked ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')}>
          <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0')} />
        </div>
      </div>
    </label>
  )
}

function TimeField({ label, name, register }: { label: string; name: string; register: ReturnType<typeof useForm>['register'] }) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] mb-1">{label}</label>
      {/* @ts-ignore dynamic name */}
      <input {...register(name)} type="time" className="w-full text-sm rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
    </div>
  )
}

function inputCls(hasError: boolean) {
  return cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-[var(--text-primary)] bg-white',
    'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-shadow',
    hasError ? 'border-red-400 focus:ring-red-300' : 'border-[var(--border)]',
  )
}
