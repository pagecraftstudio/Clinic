'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leaveSchema, type LeaveSchema } from '@/lib/validations/doctor'
import { createLeave, deleteLeave } from '@/features/doctors/actions'
import type { DoctorLeave } from '@/types/doctor'
import { format } from 'date-fns'
import { X, Plus, Trash2, CalendarOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  doctorId: string
  leaves: DoctorLeave[]
  onClose: () => void
  onMutate?: () => void
}

export function LeaveDialog({ doctorId, leaves, onClose, onMutate }: Props) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeaveSchema>({
    resolver: zodResolver(leaveSchema),
    defaultValues: { start_date: '', end_date: '', reason: '' },
  })

  function onSubmit(values: LeaveSchema) {
    setServerError(null)
    startTransition(async () => {
      const res = await createLeave(doctorId, values)
      if (!res.success) { setServerError(res.error ?? 'Error'); return }
      reset()
      onMutate?.()
    })
  }

  function handleDelete(leaveId: string) {
    startTransition(async () => {
      await deleteLeave(leaveId, doctorId)
      onMutate?.()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <CalendarOff className="size-5 text-orange-500" />
            <h2 className="font-semibold text-[var(--text-primary)]">Leave Management</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-muted)] transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add leave form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Add Leave Period</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-[var(--text-muted)]">Start date</label>
                <input
                  {...register('start_date')}
                  type="date"
                  className={cn(
                    'w-full text-sm rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]',
                    errors.start_date ? 'border-red-400' : 'border-[var(--border)]',
                  )}
                />
                {errors.start_date && <p className="text-xs text-red-500">{errors.start_date.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[var(--text-muted)]">End date</label>
                <input
                  {...register('end_date')}
                  type="date"
                  className={cn(
                    'w-full text-sm rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]',
                    errors.end_date ? 'border-red-400' : 'border-[var(--border)]',
                  )}
                />
                {errors.end_date && <p className="text-xs text-red-500">{errors.end_date.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-muted)]">Reason (optional)</label>
              <input
                {...register('reason')}
                placeholder="Annual leave, conference, etc."
                className="w-full text-sm rounded-lg border border-[var(--border)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            {serverError && <p className="text-xs text-red-500">{serverError}</p>}
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add Leave
            </button>
          </form>

          {/* Existing leaves */}
          {leaves.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Scheduled Leaves</h3>
              <div className="space-y-2">
                {leaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {format(new Date(leave.start_date), 'MMM d, yyyy')}
                        {' — '}
                        {format(new Date(leave.end_date), 'MMM d, yyyy')}
                      </p>
                      {leave.reason && <p className="text-xs text-[var(--text-muted)]">{leave.reason}</p>}
                    </div>
                    <button
                      onClick={() => handleDelete(leave.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {leaves.length === 0 && (
            <div className="text-center py-6 text-[var(--text-muted)]">
              <CalendarOff className="size-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No leaves scheduled</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
