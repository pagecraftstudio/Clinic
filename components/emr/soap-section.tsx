'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { upsertSOAPNote } from '@/features/emr/actions'
import { soapSchema, type SOAPSchema } from '@/lib/validations/emr'
import type { Visit, ICD10Code } from '@/types/emr'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PlusIcon, TrashIcon } from 'lucide-react'

interface SOAPSectionProps {
  visit: Visit
  readOnly: boolean
}

const SOAP_FIELDS = [
  { key: 'subjective' as const,  label: 'S — Subjective',  hint: 'Patient history, HPI, complaints' },
  { key: 'objective' as const,   label: 'O — Objective',   hint: 'Examination findings, observations' },
  { key: 'assessment' as const,  label: 'A — Assessment',  hint: 'Diagnosis, differential, impression' },
  { key: 'plan' as const,        label: 'P — Plan',        hint: 'Treatment, referrals, follow-up instructions' },
]

// Diagnosis codes are stored as a flat string[] (soap_notes.diagnosis_codes).
// This UI collects a code + description locally for a nicer add-flow, but
// only the codes themselves are persisted.
function codesToLocalDiagnoses(codes: string[] | null | undefined): ICD10Code[] {
  return (codes ?? []).map((code) => ({ code, description: '', type: 'primary' as const }))
}

export function SOAPSection({ visit, readOnly }: SOAPSectionProps) {
  const note = visit.soap_note
  const [isPending, startTransition] = useTransition()
  const [diagnoses, setDiagnoses] = useState<ICD10Code[]>(codesToLocalDiagnoses(note?.diagnosis_codes))
  const [newDx, setNewDx] = useState({ code: '', description: '', type: 'primary' as ICD10Code['type'] })

  const form = useForm<SOAPSchema>({
    resolver: zodResolver(soapSchema),
    defaultValues: {
      subjective: note?.subjective ?? '',
      objective:  note?.objective ?? '',
      assessment: note?.assessment ?? '',
      plan:       note?.plan ?? '',
    },
  })

  function onSave(values: SOAPSchema) {
    startTransition(async () => {
      try {
        await upsertSOAPNote({
          ...values,
          visit_id: visit.id,
          patient_id: visit.patient_id,
          diagnosis_codes: diagnoses.map((d) => d.code),
        })
        toast.success('SOAP note saved')
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  function addDiagnosis() {
    if (!newDx.code || !newDx.description) return
    setDiagnoses((prev) => [...prev, { ...newDx }])
    setNewDx({ code: '', description: '', type: 'primary' })
  }

  function removeDiagnosis(idx: number) {
    setDiagnoses((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        {/* SOAP text fields */}
        {SOAP_FIELDS.map(({ key, label, hint }) => (
          <FormField
            key={key}
            control={form.control}
            name={key}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-sm">{label}</FormLabel>
                <p className="text-xs text-muted-foreground -mt-1 mb-1">{hint}</p>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    readOnly={readOnly}
                    rows={4}
                    placeholder={readOnly ? '—' : `Enter ${label.split('—')[1].trim().toLowerCase()}…`}
                    className="resize-none font-mono text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Separator />

        {/* ICD-10 Diagnoses */}
        <div className="space-y-3">
          <p className="font-semibold text-sm">Diagnoses (ICD-10)</p>

          {/* List */}
          {diagnoses.length > 0 && (
            <div className="space-y-2">
              {diagnoses.map((dx, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant={dx.type === 'primary' ? 'default' : 'secondary'} className="shrink-0 text-xs">
                      {dx.code}
                    </Badge>
                    <span className="truncate text-muted-foreground">{dx.description}</span>
                  </div>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeDiagnosis(idx)}
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new */}
          {!readOnly && (
            <div className="flex gap-2">
              <Input
                placeholder="J06.9"
                value={newDx.code}
                onChange={(e) => setNewDx((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="w-24 font-mono text-sm"
              />
              <Input
                placeholder="Description"
                value={newDx.description}
                onChange={(e) => setNewDx((p) => ({ ...p, description: e.target.value }))}
                className="flex-1 text-sm"
              />
              <Select
                value={newDx.type}
                onValueChange={(v) => setNewDx((p) => ({ ...p, type: v as ICD10Code['type'] }))}
              >
                <SelectTrigger className="w-28 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={addDiagnosis}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
