'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { appointmentSchema, type AppointmentSchema } from '@/lib/validations/appointment'
import { createAppointment, updateAppointment } from '@/features/appointments/actions'
import { useDoctors } from '@/features/appointments/hooks'
import type { Appointment } from '@/types/appointment'
import { cn } from '@/lib/utils'
import { Loader2, CalendarClock, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

interface Props {
  appointment?: Appointment
  defaultPatientId?: string
  onSuccess?: (id: string) => void
}

const TYPES = [
  { value: 'in_person', label: 'In Person' },
  { value: 'online',    label: 'Online' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'urgent',    label: 'Urgent' },
  { value: 'routine',   label: 'Routine' },
] as const

const DURATIONS = [10, 15, 20, 30, 45, 60, 90, 120]

export function AppointmentForm({ appointment, defaultPatientId, onSuccess }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [patientLabel, setPatientLabel] = useState(
    appointment?.patients?.full_name ?? ''
  )
  const [showPatientDrop, setShowPatientDrop] = useState(false)

  const { data: doctors = [] } = useDoctors()

  const { data: patientResults = [] } = useQuery({
    queryKey: ['patient-search', patientSearch],
    queryFn: async () => {
      if (patientSearch.length < 2) return []
      const supabase = createClient()
      const { data } = await supabase.rpc('search_patients', { p_query: patientSearch, p_limit: 8 })
      return data ?? []
    },
    enabled: patientSearch.length >= 2,
  })

  const isEdit = !!appointment

  function toLocalDatetime(iso: string) {
    const d = new Date(iso)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors },
  } = useForm<AppointmentSchema>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id:      appointment?.patient_id ?? defaultPatientId ?? '',
      doctor_id:       appointment?.doctor_id ?? '',
      scheduled_at:    appointment?.scheduled_at ? toLocalDatetime(appointment.scheduled_at) : '',
      duration:        appointment?.duration ?? 30,
      type:            appointment?.type ?? 'in_person',
      chief_complaint: appointment?.chief_complaint ?? '',
      notes:           appointment?.notes ?? '',
      is_online:       appointment?.is_online ?? false,
      online_link:     appointment?.online_link ?? '',
    },
  })

  const isOnline = watch('is_online')
  const apptType = watch('type')

  async function onSubmit(values: AppointmentSchema) {
    setServerError(null)
    const scheduled_at = new Date(values.scheduled_at).toISOString()
    const payload = { ...values, scheduled_at }

    startTransition(async () => {
      const result = isEdit
        ? await updateAppointment(appointment!.id, payload)
        : await createAppointment(payload)

      if (!result.success) {
        setServerError(result.error ?? 'Something went wrong')
        return
      }

      if (onSuccess && 'data' in result && result.data) {
        onSuccess((result.data as { id: string }).id)
      } else {
        router.push('/appointments')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Patient */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            Patient <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={patientLabel}
              onChange={e => {
                setPatientLabel(e.target.value)
                setPatientSearch(e.target.value)
                setShowPatientDrop(true)
                if (!e.target.value) setValue('patient_id', '')
              }}
              onFocus={() => setShowPatientDrop(true)}
              placeholder="Search patient by name, phone, ID…"
              className={cn(
                'w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm bg-white transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent',
                errors.patient_id ? 'border-red-400' : 'border-[var(--border)]',
              )}
            />
            <input type="hidden" {...register('patient_id')} />
          </div>
          {showPatientDrop && patientResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
              {patientResults.map((p: { id: string; full_name: string; patient_number: string; phone: string }) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--bg-subtle)] text-left text-sm"
                  onClick={() => {
                    setValue('patient_id', p.id)
                    setPatientLabel(`${p.full_name} (${p.patient_number})`)
                    setPatientSearch('')
                    setShowPatientDrop(false)
                  }}
                >
                  <span className="font-medium text-[var(--text-primary)]">{p.full_name}</span>
                  <span className="text-[var(--text-muted)] text-xs">{p.phone}</span>
                </button>
              ))}
            </div>
          )}
          {errors.patient_id && (
            <p className="mt-1 text-xs text-red-600">{errors.patient_id.message}</p>
          )}
        </div>

        {/* Doctor */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            Doctor <span className="text-red-500">*</span>
          </label>
          <select
            {...register('doctor_id')}
            className={cn(
              'w-full px-3 py-2.5 rounded-lg border text-sm bg-white transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent',
              errors.doctor_id ? 'border-red-400' : 'border-[var(--border)]',
            )}
          >
            <option value="">Select doctor</option>
            {doctors.map((d: { id: string; specialty: string; profiles: { display_name: string } }) => (
              <option key={d.id} value={d.id}>
                {d.profiles?.display_name} — {d.specialty}
              </option>
            ))}
          </select>
          {errors.doctor_id && (
            <p className="mt-1 text-xs text-red-600">{errors.doctor_id.message}</p>
          )}
        </div>
      </div>

      {/* Date/Time + Duration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            {...register('scheduled_at')}
            className={cn(
              'w-full px-3 py-2.5 rounded-lg border text-sm bg-white transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent',
              errors.scheduled_at ? 'border-red-400' : 'border-[var(--border)]',
            )}
          />
          {errors.scheduled_at && (
            <p className="mt-1 text-xs text-red-600">{errors.scheduled_at.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Duration (min)</label>
          <select
            {...register('duration')}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Type</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setValue('type', t.value)
                if (t.value === 'online') setValue('is_online', true)
                else setValue('is_online', false)
              }}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
                apptType === t.value
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'bg-white text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Online link */}
      {isOnline && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Online Meeting Link</label>
          <input
            type="url"
            {...register('online_link')}
            placeholder="https://meet.google.com/..."
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      )}

      {/* Chief complaint */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Chief Complaint</label>
        <input
          type="text"
          {...register('chief_complaint')}
          placeholder="Reason for visit"
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Notes</label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Internal notes…"
          className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}
          {isEdit ? 'Save Changes' : 'Book Appointment'}
        </button>
      </div>
    </form>
  )
}
