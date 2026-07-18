'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { patientSchema, type PatientFormValues, BLOOD_GROUPS, GENDERS, PATIENT_SOURCES } from '@/lib/validations/patient'
import type { Patient } from '@/types/patient'

interface PatientFormProps {
  patient?: Patient
  onSubmit: (values: PatientFormValues) => Promise<{ success: boolean; error?: string }>
}

function toDefaultValues(patient?: Patient): Partial<PatientFormValues> {
  if (!patient) return { blood_group: 'unknown', country: 'EG', nationality: 'Egyptian', language_pref: 'ar', source: 'walk_in', emergency_contacts: [] }
  return {
    ...patient,
    first_name_ar: patient.first_name_ar ?? '',
    last_name_ar: patient.last_name_ar ?? '',
    date_of_birth: patient.date_of_birth ?? '',
    national_id: patient.national_id ?? '',
    passport_number: patient.passport_number ?? '',
    phone_alt: patient.phone_alt ?? '',
    email: patient.email ?? '',
    address: patient.address ?? '',
    city: patient.city ?? '',
    governorate: patient.governorate ?? '',
    occupation: patient.occupation ?? '',
    marital_status: patient.marital_status ?? '',
    allergies: patient.allergies ?? [],
    chronic_diseases: patient.chronic_diseases ?? [],
    current_medications: patient.current_medications ?? [],
    notes: patient.notes ?? '',
    insurance_company: patient.insurance_company ?? '',
    insurance_number: patient.insurance_number ?? '',
    insurance_expiry: patient.insurance_expiry ?? '',
    source: (patient.source as PatientFormValues['source']) ?? 'walk_in',
    emergency_contacts: [],
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function Field({ label, error, children, full }: { label: string; error?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2 space-y-1.5' : 'space-y-1.5'}>
      <Label className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</Label>
      {children}
      {error && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  )
}

function TagInput({
  label, values, onChange, placeholder,
}: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')

  function commit() {
    const v = draft.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setDraft('')
  }

  return (
    <Field label={label} full>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
          >
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() }
        }}
        onBlur={commit}
      />
    </Field>
  )
}

export function PatientForm({ patient, onSubmit }: PatientFormProps) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: toDefaultValues(patient),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'emergency_contacts' })

  async function handleValid(values: PatientFormValues) {
    setSubmitError(null)
    const result = await onSubmit(values)
    if (!result.success) setSubmitError(result.error ?? 'Something went wrong')
    else router.push('/patients')
  }

  return (
    <form onSubmit={handleSubmit(handleValid)} className="space-y-5 max-w-3xl">
      <Section title="Basic information">
        <Field label="First name" error={errors.first_name?.message}>
          <Input {...register('first_name')} />
        </Field>
        <Field label="Last name" error={errors.last_name?.message}>
          <Input {...register('last_name')} />
        </Field>
        <Field label="الاسم الأول (بالعربي)">
          <Input dir="rtl" {...register('first_name_ar')} />
        </Field>
        <Field label="اسم العائلة (بالعربي)">
          <Input dir="rtl" {...register('last_name_ar')} />
        </Field>
        <Field label="Date of birth">
          <Input type="date" {...register('date_of_birth')} />
        </Field>
        <Field label="Gender">
          <Select value={watch('gender') ?? undefined} onValueChange={(v) => setValue('gender', v as PatientFormValues['gender'])}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Blood group">
          <Select value={watch('blood_group')} onValueChange={(v) => setValue('blood_group', v as PatientFormValues['blood_group'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="National ID" error={errors.national_id?.message}>
          <Input maxLength={14} {...register('national_id')} />
        </Field>
        <Field label="Passport number">
          <Input {...register('passport_number')} />
        </Field>
      </Section>

      <Section title="Contact">
        <Field label="Phone" error={errors.phone?.message}>
          <Input dir="ltr" {...register('phone')} />
        </Field>
        <Field label="Alternate phone" error={errors.phone_alt?.message}>
          <Input dir="ltr" {...register('phone_alt')} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register('email')} />
        </Field>
        <Field label="Governorate">
          <Input {...register('governorate')} />
        </Field>
        <Field label="City">
          <Input {...register('city')} />
        </Field>
        <Field label="Occupation">
          <Input {...register('occupation')} />
        </Field>
        <Field label="Address" full>
          <Textarea rows={2} {...register('address')} />
        </Field>
      </Section>

      <Section title="Medical">
        <TagInput label="Allergies" values={watch('allergies') ?? []} onChange={(v) => setValue('allergies', v)} placeholder="Type and press Enter" />
        <TagInput label="Chronic diseases" values={watch('chronic_diseases') ?? []} onChange={(v) => setValue('chronic_diseases', v)} placeholder="Type and press Enter" />
        <TagInput label="Current medications" values={watch('current_medications') ?? []} onChange={(v) => setValue('current_medications', v)} placeholder="Type and press Enter" />
        <Field label="Notes" full>
          <Textarea rows={3} {...register('notes')} />
        </Field>
      </Section>

      <Section title="Insurance">
        <Field label="Insurance company">
          <Input {...register('insurance_company')} />
        </Field>
        <Field label="Insurance number">
          <Input {...register('insurance_number')} />
        </Field>
        <Field label="Insurance expiry">
          <Input type="date" {...register('insurance_expiry')} />
        </Field>
        <Field label="Source">
          <Select value={watch('source')} onValueChange={(v) => setValue('source', v as PatientFormValues['source'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PATIENT_SOURCES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Emergency contacts</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', relation: '', phone: '', phone_alt: '', is_primary: fields.length === 0 })}>
            <Plus size={13} className="mr-1" /> Add contact
          </Button>
        </div>
        {fields.length === 0 && (
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>No emergency contacts added.</p>
        )}
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
            <Field label="Name" error={errors.emergency_contacts?.[index]?.name?.message}>
              <Input {...register(`emergency_contacts.${index}.name`)} />
            </Field>
            <Field label="Relation" error={errors.emergency_contacts?.[index]?.relation?.message}>
              <Input {...register(`emergency_contacts.${index}.relation`)} />
            </Field>
            <Field label="Phone" error={errors.emergency_contacts?.[index]?.phone?.message}>
              <Input dir="ltr" {...register(`emergency_contacts.${index}.phone`)} />
            </Field>
            <div className="flex items-end justify-between gap-3">
              <label className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                <Checkbox checked={watch(`emergency_contacts.${index}.is_primary`)} onCheckedChange={(v) => setValue(`emergency_contacts.${index}.is_primary`, Boolean(v))} />
                Primary contact
              </label>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 size={14} style={{ color: 'var(--danger)' }} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {submitError && (
        <p className="text-[13px] px-4 py-2.5 rounded-lg" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
          {submitError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={14} className="mr-2 animate-spin" />}
          {patient ? 'Save changes' : 'Register patient'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
