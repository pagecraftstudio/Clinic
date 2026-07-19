'use client'

import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { prescriptionSchema, type PrescriptionFormValues } from '@/lib/validations/prescription'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface PrescriptionFormProps {
  defaultValues?: Partial<PrescriptionFormValues>
  onSubmit: (values: PrescriptionFormValues) => Promise<void>
  isSubmitting?: boolean
  patients: Array<{ id: string; full_name: string; patient_number: string }>
  doctors: Array<{ id: string; specialty: string; profiles: { display_name: string } | null }>
}

const FREQUENCY_OPTIONS = [
  'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
  'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
  'Once weekly', 'As needed (PRN)',
]

const DURATION_OPTIONS = [
  '3 days', '5 days', '7 days', '10 days', '14 days',
  '1 month', '2 months', '3 months', 'Ongoing',
]

const FORM_OPTIONS = [
  'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops',
  'Cream', 'Ointment', 'Inhaler', 'Suppository', 'Patch',
]

export function PrescriptionForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  patients,
  doctors,
}: PrescriptionFormProps) {
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patient_id: '',
      doctor_id: '',
      visit_id: null,
      valid_until: null,
      diagnosis: '',
      notes: '',
      items: [
        {
          medicine_name: '',
          strength: '',
          form: 'Tablet',
          dosage: '',
          frequency: 'Twice daily',
          duration: '7 days',
          quantity: null,
          route: 'Oral',
          instructions: '',
          is_prn: false,
          sort_order: 0,
        },
      ],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient & Doctor */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="patient_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name} ({p.patient_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doctor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.profiles?.display_name ?? 'Unknown'} — {d.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="diagnosis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Diagnosis</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} placeholder="Primary diagnosis" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="valid_until"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid Until</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Medicine Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Medicines</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({
                medicine_name: '', strength: '', form: 'Tablet',
                dosage: '', frequency: 'Twice daily', duration: '7 days',
                quantity: null, route: 'Oral', instructions: '', is_prn: false, sort_order: fields.length,
              })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Medicine
            </Button>
          </div>

          {fields.map((field, idx) => (
            <div key={field.id} className="rounded-xl border p-4 space-y-3 relative">
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name={`items.${idx}.medicine_name`}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs">Medicine Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Amoxicillin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${idx}.strength`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Strength</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} placeholder="e.g. 500mg" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <FormField
                  control={form.control}
                  name={`items.${idx}.form`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Form</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {FORM_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${idx}.dosage`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Dosage</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 1 tablet" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${idx}.frequency`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${idx}.duration`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Duration</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {DURATION_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`items.${idx}.instructions`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Special Instructions</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} placeholder="e.g. Take with food" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ''} rows={2} placeholder="Additional notes…" className="resize-none" />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Prescription'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
