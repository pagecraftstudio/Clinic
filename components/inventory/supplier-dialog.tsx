'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supplierSchema, type SupplierSchema } from '@/lib/validations/inventory'
import { useCreateSupplier, useUpdateSupplier } from '@/features/inventory/hooks'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Supplier } from '@/types/inventory'

interface Props {
  supplier?: Supplier | null
  open: boolean
  onClose: () => void
}

export function SupplierDialog({ supplier, open, onClose }: Props) {
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier(supplier?.id ?? '')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierSchema>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name ?? '',
      contact: supplier?.contact ?? '',
      phone: supplier?.phone ?? '',
      email: supplier?.email ?? '',
      address: supplier?.address ?? '',
      notes: supplier?.notes ?? '',
    },
  })

  useEffect(() => {
    reset({
      name: supplier?.name ?? '',
      contact: supplier?.contact ?? '',
      phone: supplier?.phone ?? '',
      email: supplier?.email ?? '',
      address: supplier?.address ?? '',
      notes: supplier?.notes ?? '',
    })
  }, [supplier, reset])

  async function onSubmit(data: SupplierSchema) {
    const res = supplier
      ? await updateSupplier.mutateAsync(data)
      : await createSupplier.mutateAsync(data)
    if (res.success) {
      reset()
      onClose()
    }
  }

  const isPending = createSupplier.isPending || updateSupplier.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Edit Supplier' : 'New Supplier'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="sup_name">Name <span className="text-red-500">*</span></Label>
            <Input id="sup_name" {...register('name')} placeholder="Supplier name" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sup_contact">Contact Person</Label>
              <Input id="sup_contact" {...register('contact')} placeholder="Name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup_phone">Phone</Label>
              <Input id="sup_phone" {...register('phone')} placeholder="+20 xxx" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup_email">Email</Label>
            <Input id="sup_email" type="email" {...register('email')} placeholder="supplier@example.com" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup_address">Address</Label>
            <Input id="sup_address" {...register('address')} placeholder="Address" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sup_notes">Notes</Label>
            <Textarea id="sup_notes" {...register('notes')} rows={2} placeholder="Notes..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : supplier ? 'Update' : 'Create Supplier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
