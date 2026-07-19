'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { purchaseOrderSchema, type PurchaseOrderSchema } from '@/lib/validations/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import type { Supplier, InventoryItem } from '@/types/inventory'

interface Props {
  suppliers: Supplier[]
  items: InventoryItem[]
  onSubmit: (data: PurchaseOrderSchema) => Promise<void>
  isLoading?: boolean
}

export function PurchaseOrderForm({ suppliers, items, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<PurchaseOrderSchema>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier_id: '',
      expected_at: '',
      notes: '',
      items: [{ item_id: '', quantity: 1, unit_cost: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const watchedItems = watch('items')
  const total = (watchedItems ?? []).reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_cost ?? 0), 0)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Order Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Supplier <span className="text-red-500">*</span></Label>
            <Select value={watch('supplier_id')} onValueChange={(v) => setValue('supplier_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.supplier_id && <p className="text-xs text-red-500">{errors.supplier_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expected_at">Expected Delivery</Label>
            <Input id="expected_at" type="date" {...register('expected_at')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="po_notes">Notes</Label>
          <Textarea id="po_notes" {...register('notes')} rows={2} placeholder="Notes..." />
        </div>
      </div>

      <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Order Items</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ item_id: '', quantity: 1, unit_cost: 0 })}
          >
            <Plus size={14} className="mr-1" />
            Add Item
          </Button>
        </div>

        {errors.items && typeof errors.items.message === 'string' && (
          <p className="text-xs text-red-500">{errors.items.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5 space-y-1">
                {idx === 0 && <Label className="text-xs">Item</Label>}
                <Select
                  value={watch(`items.${idx}.item_id`)}
                  onValueChange={(v) => {
                    setValue(`items.${idx}.item_id`, v)
                    const found = items.find((i) => i.id === v)
                    if (found?.unit_price) setValue(`items.${idx}.unit_cost`, found.unit_price)
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} {i.sku ? `(${i.sku})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                {idx === 0 && <Label className="text-xs">Qty</Label>}
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  className="h-9"
                  {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                />
              </div>
              <div className="col-span-3 space-y-1">
                {idx === 0 && <Label className="text-xs">Unit Cost</Label>}
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-9"
                  {...register(`items.${idx}.unit_cost`, { valueAsNumber: true })}
                />
              </div>
              <div className="col-span-1 space-y-1">
                {idx === 0 && <div className="text-xs invisible">Total</div>}
                <p className="text-xs font-medium h-9 flex items-center" style={{ color: 'var(--text-secondary)' }}>
                  {((watchedItems?.[idx]?.quantity ?? 0) * (watchedItems?.[idx]?.unit_cost ?? 0)).toFixed(0)}
                </p>
              </div>
              <div className="col-span-1">
                {idx === 0 && <div className="invisible text-xs">X</div>}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => fields.length > 1 && remove(idx)}
                  disabled={fields.length === 1}
                >
                  <Trash2 size={14} style={{ color: 'var(--error)' }} />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Total: <span style={{ color: 'var(--accent)' }}>EGP {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Purchase Order'}
        </Button>
      </div>
    </form>
  )
}
