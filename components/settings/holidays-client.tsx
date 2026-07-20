'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, RefreshCw, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { cn, formatDate } from '@/lib/utils'
import { createHoliday, deleteHoliday } from '@/features/settings/actions'
import { holidaySchema, type HolidayInput } from '@/lib/validations/settings'
import { useHolidays } from '@/features/settings/hooks'
import type { Holiday } from '@/types/settings'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface Props { initialHolidays: Holiday[] }

export function HolidaysClient({ initialHolidays }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { data: holidays = initialHolidays } = useHolidays()

  // Group by month
  const grouped = MONTHS.map((month, idx) => ({
    month,
    holidays: holidays.filter((h) => new Date(h.date).getMonth() === idx),
  })).filter((g) => g.holidays.length > 0)

  function handleDelete(id: string) {
    if (!confirm('Delete this holiday?')) return
    startTransition(async () => {
      await deleteHoliday(id)
    })
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-[var(--text-muted)]">
            {holidays.length} holidays configured
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-9 bg-blue-600 hover:bg-blue-700 text-white text-[13px]"
        >
          <Plus size={14} />
          Add Holiday
        </Button>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] py-16 flex flex-col items-center gap-3 text-[var(--text-muted)]">
          <Calendar size={28} className="opacity-40" />
          <p className="text-[13px]">No holidays configured</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ month, holidays: mHolidays }) => (
            <div key={month}>
              <h3 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">
                {month}
              </h3>
              <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
                {mHolidays.map((h) => (
                  <div key={h.id} className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg-subtle)] transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-[var(--text-muted)] leading-none">
                        {new Date(h.date).toLocaleString('en', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="font-semibold text-[15px] leading-none mt-0.5">
                        {new Date(h.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium">{h.name}</p>
                      {h.name_ar && (
                        <p className="text-[var(--text-muted)] text-[11px]" dir="rtl">{h.name_ar}</p>
                      )}
                    </div>
                    {h.is_recurring && (
                      <span className="flex items-center gap-1 text-[11px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        <RefreshCw size={10} />
                        Yearly
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(h.id)}
                      disabled={isPending}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateHolidayDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}

function CreateHolidayDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<HolidayInput>({
    resolver: zodResolver(holidaySchema),
    defaultValues: { is_recurring: false },
  })

  const isRecurring = watch('is_recurring')

  function onSubmit(data: HolidayInput) {
    setError(null)
    startTransition(async () => {
      const result = await createHoliday(data)
      if (result.success) {
        reset()
        onClose()
      } else {
        setError(result.error ?? 'Failed to create holiday')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Holiday</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-[12px] text-[var(--text-muted)]">Holiday Name (EN)</Label>
            <Input {...register('name')} placeholder="Eid Al-Fitr" className={inputCls} />
            {errors.name && <p className="text-[11px] text-red-400">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] text-[var(--text-muted)]">Holiday Name (AR)</Label>
            <Input {...register('name_ar')} placeholder="عيد الفطر" dir="rtl" className={inputCls} />
          </div>
          <div className="space-y-1">
            <Label className="text-[12px] text-[var(--text-muted)]">Date</Label>
            <Input {...register('date')} type="date" className={inputCls} />
            {errors.date && <p className="text-[11px] text-red-400">{errors.date.message}</p>}
          </div>
          <button
            type="button"
            onClick={() => setValue('is_recurring', !isRecurring)}
            className={cn(
              'flex items-center gap-2 text-[13px] transition-colors',
              isRecurring ? 'text-blue-300' : 'text-[var(--text-muted)]'
            )}
          >
            <div className={cn(
              'w-4 h-4 rounded border flex items-center justify-center',
              isRecurring ? 'bg-blue-600 border-blue-600' : 'border-[var(--border-strong)]'
            )}>
              {isRecurring && <span className="text-[9px]">✓</span>}
            </div>
            Repeat every year
          </button>
          {error && <p className="text-[13px] text-red-400">{error}</p>}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[var(--border)]">Cancel</Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? 'Adding…' : 'Add Holiday'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const inputCls = 'bg-[var(--bg-subtle)] border-[var(--border)] text-white placeholder:text-[var(--text-muted)]/50 focus:border-blue-500/50 h-9 text-[13px]'
