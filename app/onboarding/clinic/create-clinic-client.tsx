'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClinic } from '@/features/clinics/actions'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  country: z.string().default('EG'),
  currency: z.string().default('EGP'),
  timezone: z.string().default('Africa/Cairo'),
})

type FormValues = z.infer<typeof schema>

const CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'AED', 'SAR']
const TIMEZONES = ['Africa/Cairo', 'Asia/Dubai', 'Asia/Riyadh', 'Europe/London', 'America/New_York']

export function CreateClinicClient() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { country: 'EG', currency: 'EGP', timezone: 'Africa/Cairo' },
  })

  function onSubmit(values: FormValues) {
    setError(null)
    startTransition(async () => {
      const res = await createClinic(values)
      if (!res.success) { setError(res.error ?? 'Error'); return }
      toast.success('Clinic created!')
      router.push('/')
    })
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Create a new clinic</CardTitle>
        <CardDescription>Set up your clinic workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Clinic name *</Label>
            <Input {...register('name')} placeholder="My Clinic" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>URL slug *</Label>
            <Input {...register('slug')} placeholder="my-clinic" className="font-mono" />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            <p className="text-xs text-muted-foreground">Used in URLs. Cannot be changed later.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input {...register('phone')} placeholder="+20 1XX XXXX XXX" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input {...register('email')} placeholder="clinic@example.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select defaultValue="EGP" onValueChange={v => setValue('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select defaultValue="Africa/Cairo" onValueChange={v => setValue('timezone', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create clinic
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
