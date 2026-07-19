'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { stockAdjustmentSchema, type StockAdjustmentSchema } from '@/lib/validations/inventory'
import { useAdjustStock } from '@/features/inventory/hooks'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { InventoryItem, StockMovementType } from '@/types/inventory'

interface Props {
  item: InventoryItem | null
  open: boolean
  onClose: () => void
}

const MOVEMENT_TYPES: { value: StockMovementType; label: string; color: string }[] = [
  { value: 'in', label: 'Stock In (Receive)', color: 'var(--success)' },
  { value: 'out', label: 'Stock Out (Dispense)', color: 'var(--error)' },
  { value: 'adjustment', label: 'Manual Adjustment', color: 'var(--accent)' },
  { value: 'return', label: 'Return to Stock', color: 'var(--warning)' },
  { value: 'expired', label: 'Expired / Disposed', color: 'var(--text-muted)' },
]

export function StockAdjustmentDialog({ item, open, onClose }: Props) {
  const adjustStock = useAdjustStock()
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<StockAdjustmentSchema>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: { item_id: item?.id ?? '', type: 'in', quantity: 1 },
  })

  const type = watch('type')

  async function onSubmit(data: StockAdjustmentSchema) {
    const res = await adjustStock.mutateAsync({ ...data, item_id: item!.id })
    if (res.success) {
      reset()
      onClose()
    }
  }

  const typeInfo = MOVEMENT_TYPES.find((t) => t.value === type)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Stock Adjustment</DialogTitle>
          {item && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {item.name} — Current: <strong>{item.current_stock} {item.unit}</strong>
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Movement Type</Label>
            <Select value={type} onValueChange={(v) => setValue('type', v as StockMovementType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span style={{ color: t.color }}>{t.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity <span className="text-red-500">*</span></Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                min="0.001"
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit_cost">Unit Cost (EGP)</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                min="0"
                {...register('unit_cost', { valueAsNumber: true })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adj_notes">Notes</Label>
            <Textarea id="adj_notes" {...register('notes')} placeholder="Reason for adjustment..." rows={2} />
          </div>

          {adjustStock.data && !adjustStock.data.success && (
            <p className="text-sm text-red-500">{adjustStock.data.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={adjustStock.isPending}>
              {adjustStock.isPending ? 'Saving...' : 'Save Adjustment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
