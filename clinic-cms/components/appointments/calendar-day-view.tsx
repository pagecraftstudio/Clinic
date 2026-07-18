'use client'

import { useMemo } from 'react'
import { format, isSameDay } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types/appointment'
import { AppointmentStatusBadge } from './appointment-status-badge'

const HOUR_HEIGHT = 64 // px per hour
const START_HOUR  = 7  // 7 AM
const END_HOUR    = 22 // 10 PM
const TOTAL_HOURS = END_HOUR - START_HOUR

const STATUS_BG: Record<string, string> = {
  scheduled:   'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
  confirmed:   'bg-sky-50 border-sky-200 hover:bg-sky-100',
  checked_in:  'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  in_progress: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
  completed:   'bg-gray-50 border-gray-200 hover:bg-gray-100',
  cancelled:   'bg-red-50 border-red-200 opacity-60',
  no_show:     'bg-gray-50 border-gray-200 opacity-50',
  rescheduled: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
}
const STATUS_LEFT: Record<string, string> = {
  scheduled:   'bg-indigo-400',
  confirmed:   'bg-sky-400',
  checked_in:  'bg-emerald-400',
  in_progress: 'bg-amber-400',
  completed:   'bg-gray-300',
  cancelled:   'bg-red-400',
  no_show:     'bg-gray-300',
  rescheduled: 'bg-purple-400',
}

interface Props {
  date: Date
  appointments: Appointment[]
}

export function CalendarDayView({ date, appointments }: Props) {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)

  const positioned = useMemo(() => {
    return appointments
      .filter(a => isSameDay(new Date(a.scheduled_at), date))
      .map(apt => {
        const start  = new Date(apt.scheduled_at)
        const startH = start.getHours() + start.getMinutes() / 60
        const top    = (startH - START_HOUR) * HOUR_HEIGHT
        const height = Math.max((apt.duration / 60) * HOUR_HEIGHT, 24)
        return { apt, top, height }
      })
  }, [appointments, date])

  const now = new Date()
  const isToday = isSameDay(date, now)
  const nowTop = isToday
    ? (now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT
    : -1

  return (
    <div className="flex h-full overflow-y-auto">
      {/* Hour labels */}
      <div className="flex-shrink-0 w-16 pt-0">
        {hours.map(h => (
          <div key={h} style={{ height: HOUR_HEIGHT }} className="relative flex items-start justify-end pr-3 pt-1">
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
            </span>
          </div>
        ))}
      </div>

      {/* Grid + events */}
      <div
        className="relative flex-1 border-l border-[var(--border)]"
        style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
      >
        {/* Hour lines */}
        {hours.map(h => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-[var(--border)]"
            style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
          />
        ))}

        {/* Now indicator */}
        {isToday && nowTop >= 0 && nowTop <= TOTAL_HOURS * HOUR_HEIGHT && (
          <div className="absolute left-0 right-0 z-10 flex items-center" style={{ top: nowTop }}>
            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
            <div className="flex-1 h-px bg-red-500" />
          </div>
        )}

        {/* Appointments */}
        {positioned.map(({ apt, top, height }) => (
          <Link
            key={apt.id}
            href={`/appointments/${apt.id}`}
            className={cn(
              'absolute left-2 right-2 rounded-lg border overflow-hidden cursor-pointer transition-all',
              STATUS_BG[apt.status] ?? 'bg-gray-50 border-gray-200',
            )}
            style={{ top: top + 1, height: height - 2 }}
          >
            <div className={cn('absolute left-0 top-0 bottom-0 w-1', STATUS_LEFT[apt.status])} />
            <div className="pl-2.5 pr-2 py-1 h-full overflow-hidden">
              <div className="font-semibold text-xs text-[var(--text-primary)] truncate leading-tight">
                {apt.patients?.full_name ?? 'Patient'}
              </div>
              {height > 36 && (
                <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                  {apt.doctors?.profiles?.display_name ?? ''} · {apt.duration}m
                </div>
              )}
              {height > 56 && apt.chief_complaint && (
                <div className="text-xs text-[var(--text-secondary)] truncate mt-1 italic">
                  {apt.chief_complaint}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
