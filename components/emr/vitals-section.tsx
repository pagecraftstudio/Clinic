'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { upsertVitals } from '@/actions/emr.actions'
import { vitalsSchema, type VitalsSchema } from '@/types/emr.schemas'
import type { Visit } from '@/types/emr'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface VitalsSectionProps {
  visit: Visit
}

// BMI category helper
function bmiCategory(bmi: number | null | undefined): { label: string; color: string } | null {
  if (!bmi) return null
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' }
  if (bmi < 25)   return { label: 'Normal',      color: 'text-emerald-500' }
  if (bmi < 30)   return { label: 'Overweight',  color: 'text-amber-500' }
  return               { label: 'Obese',          color: 'text-red-500' }
}

const VITAL_FIELDS: {
  key: keyof VitalsSchema
  label: string
  unit: string
  placeholder: string
  min?: number
  max?: number
  step?: string
}[] = [
  { key: 'weight_kg',          label: 'Weight',           unit: 'kg',       placeholder: '70',    step: '0.1' },
  { key: 'height_cm',          label: 'Height',           unit: 'cm',       placeholder: '170',   step: '0.5' },
  { key: 'temperature_c',      label: 'Temperature',      unit: '°C',       placeholder: '37.0',  step: '0.1', min: 30, max: 45 },
  { key: 'systolic_bp',        label: 'Systolic BP',      unit: 'mmHg',     placeholder: '120',   min: 50,  max: 300 },
  { key: 'diastolic_bp',       label: 'Diastolic BP',     unit: 'mmHg',     placeholder: '80',    min: 30,  max: 200 },
  { key: 'pulse_bpm',          label: 'Pulse',            unit: 'bpm',      placeholder: '72',    min: 20,  max: 300 },
  { key: 'spo2_pct',           label: 'SpO₂',             unit: '%',        placeholder: '98',    min: 50,  max: 100 },
  { key: 'respiratory_rate',   label: 'Resp. Rate',       unit: '/min',     placeholder: '16',    min: 5,   max: 60 },
  { key: 'blood_glucose_mgdl', label: 'Blood Glucose',    unit: 'mg/dL',    placeholder: '90',    step: '0.1' },
]

export function VitalsSection({ visit }: VitalsSectionProps) {
  const vitals = visit.vitals
  const [isPending, startTransition] = useTransition()

  const form = useForm<VitalsSchema>({
    resolver: zodResolver(vitalsSchema),
    defaultValues: {
      weight_kg:           vitals?.weight_kg           ?? null,
      height_cm:           vitals?.height_cm           ?? null,
      temperature_c:       vitals?.temperature_c       ?? null,
      systolic_bp:         vitals?.systolic_bp         ?? null,
      diastolic_bp:        vitals?.diastolic_bp        ?? null,
      pulse_bpm:           vitals?.pulse_bpm           ?? null,
      spo2_pct:            vitals?.spo2_pct            ?? null,
      respiratory_rate:    vitals?.respiratory_rate    ?? null,
      blood_glucose_mgdl:  vitals?.blood_glucose_mgdl  ?? null,
      notes:               vitals?.notes               ?? null,
    },
  })

  const watchWeight = form.watch('weight_kg')
  const watchHeight = form.watch('height_cm')
  const liveOrSavedBmi = watchWeight && watchHeight
    ? Math.round((watchWeight / ((watchHeight / 100) ** 2)) * 10) / 10
    : vitals?.bmi ?? null

  const bmiInfo = bmiCategory(liveOrSavedBmi)

  function onSave(values: VitalsSchema) {
    startTransition(async () => {
      try {
        await upsertVitals({ ...values, visit_id: visit.id })
        toast.success('Vitals saved')
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to save vitals')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        {/* BMI display badge */}
        {liveOrSavedBmi && bmiInfo && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3">
            <span className="text-sm text-muted-foreground">BMI</span>
            <span className="font-semibold tabular-nums">{liveOrSavedBmi}</span>
            <Badge variant="outline" className={cn('text-xs', bmiInfo.color)}>
              {bmiInfo.label}
            </Badge>
          </div>
        )}

        {/* Vitals grid */}
        <div className="grid grid-cols-3 gap-4">
          {VITAL_FIELDS.map(({ key, label, unit, placeholder, min, max, step }) => (
            <FormField
              key={key}
              control={form.control}
              name={key}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {label}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder={placeholder}
                        step={step ?? '1'}
                        min={min}
                        max={max}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                        className="pr-12 text-sm tabular-nums"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        {unit}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Nurse Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  rows={2}
                  placeholder="Additional observations…"
                  className="resize-none text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            Save Vitals
          </Button>
        </div>
      </form>
    </Form>
  )
}
