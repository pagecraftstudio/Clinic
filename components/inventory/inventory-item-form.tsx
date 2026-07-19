'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inventoryItemSchema, type InventoryItemSchema } from '@/lib/validations/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { InventoryItem, Supplier } from '@/types/inventory'

interface Props {
  item?: InventoryItem
  suppliers: Supplier[]
  onSubmit: (data: InventoryItemSchema) => Promise<void>
  isLoading?: boolean
}

const CATEGORIES = [
  { value: 'medicine', label: 'Medicine' },
  { value: 'supply', label: 'Supply' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'consumable', label: 'Consumable' },
]

const UNITS = ['piece', 'box', 'bottle', 'vial', 'strip', 'pack', 'kg', 'g', 'mg', 'ml', 'L', 'unit']

export function InventoryItemForm({ item, suppliers, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<InventoryItemSchema>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: item?.name ?? '',
      name_ar: item?.name_ar ?? '',
      sku: item?.sku ?? '',
      barcode: item?.barcode ?? '',
      category: item?.category ?? 'supply',
      supplier_id: item?.supplier_id ?? null,
      unit: item?.unit ?? 'piece',
      unit_price: item?.unit_price ?? undefined,
      selling_price: item?.selling_price ?? undefined,
      minimum_stock: item?.minimum_stock ?? 0,
      maximum_stock: item?.maximum_stock ?? undefined,
      reorder_point: item?.reorder_point ?? undefined,
      expiry_date: item?.expiry_date ?? '',
      storage_location: item?.storage_location ?? '',
      notes: item?.notes ?? '',
    },
  })

  const category = watch('category')
  const unit = watch('unit')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input id="name" {...register('name')} placeholder="Item name" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name_ar">Arabic Name</Label>
            <Input id="name_ar" {...register('name_ar')} placeholder="الاسم بالعربية" dir="rtl" />
          </div>
          <div className="space-y-1.5">
            <Label>Category <span className="text-red-500">*</span></Label>
            <Select value={category} onValueChange={(v) => setValue('category', v as InventoryItemSchema['category'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Supplier</Label>
            <Select
              value={watch('supplier_id') ?? 'none'}
              onValueChange={(v) => setValue('supplier_id', v === 'none' ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Supplier</SelectItem>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...register('sku')} placeholder="SKU-001" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="barcode">Barcode</Label>
            <Input id="barcode" {...register('barcode')} placeholder="1234567890" />
          </div>
        </div>
      </div>

      {/* Stock & Pricing */}
      <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Stock & Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Unit <span className="text-red-500">*</span></Label>
            <Select value={unit} onValueChange={(v) => setValue('unit', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit_price">Unit Cost (EGP)</Label>
            <Input
              id="unit_price"
              type="number"
              step="0.01"
              min="0"
              {...register('unit_price', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="selling_price">Selling Price (EGP)</Label>
            <Input
              id="selling_price"
              type="number"
              step="0.01"
              min="0"
              {...register('selling_price', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minimum_stock">Min Stock <span className="text-red-500">*</span></Label>
            <Input
              id="minimum_stock"
              type="number"
              step="0.001"
              min="0"
              {...register('minimum_stock', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.minimum_stock && <p className="text-xs text-red-500">{errors.minimum_stock.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maximum_stock">Max Stock</Label>
            <Input
              id="maximum_stock"
              type="number"
              step="0.001"
              min="0"
              {...register('maximum_stock', { valueAsNumber: true })}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reorder_point">Reorder Point</Label>
            <Input
              id="reorder_point"
              type="number"
              step="0.001"
              min="0"
              {...register('reorder_point', { valueAsNumber: true })}
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      {/* Storage */}
      <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Storage Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input id="expiry_date" type="date" {...register('expiry_date')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="storage_location">Storage Location</Label>
            <Input id="storage_location" {...register('storage_location')} placeholder="Shelf A-3" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register('notes')} placeholder="Additional notes..." rows={3} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  )
}
