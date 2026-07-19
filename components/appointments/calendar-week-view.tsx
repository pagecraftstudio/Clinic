'use client'

import { useMemo } from 'react'
import {
  startOfWeek, addDays, isSameDay, format, isToday,
} from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types/appointment'

const HOUR_HEIGHT = 56
const START_HOUR  = 7
const END_HOUR    = 22
const TOTAL_HOURS = END_HOUR - START_HOUR

const STATUS_BG: Record<string, string> = {
  scheduled:   'bg-indigo-100 border-l-2 border-l-indigo-400 text-indigo-900',
  confirmed:   'bg-sky-100 border-l-2 border-l-sky-400 text-sky-900',
  checked_in:  'bg-emerald-100 border-l-2 border-l-emerald-400 text-emerald-900',
  in_progress: 'bg-amber-100 border-l-2 border-l-amber-400 text-amber-900',
  completed:   'bg-gray-100 border-l-2 border-l-gray-300 text-gray-700',
  cancelled:   'bg-red-50 border-l-2 border-l-red-300 text-red-700 opacity-60',
  no_show:     'bg-gray-50 border-l-2 border-l-gray-200 text-gray-500 opacity-60',
  rescheduled: 'bg-purple-100 border-l-2 border-l-purple-400 text-purple-900',
}

interface Props {
  weekStart: Date
  appointments: Appointment[]
}

export function CalendarWeekView({ weekStart, appointments }: Props) {
  const days  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)

  // Group by day
  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    days.forEach(d => { map[format(d, 'yyyy-MM-dd')] = [] })
    appointments.forEach(a => {
      const key = format(new Date(a.scheduled_at), 'yyyy-MM-dd')
      if (key in map) map[key].push(a)
    })
    return map
  }, [appointments, days])

  const now    = new Date()
  const nowTop = (now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex border-b border-[var(--border)] bg-white sticky top-0 z-10">
        <div className="w-16 flex-shrink-0" />
        {days.map(day => (
          <div
            key={day.toISOString()}
            className={cn(
              'flex-1 text-center py-2 text-sm border-l border-[var(--border)]',
              isToday(day) && 'bg-[var(--accent-light)]',
            )}
          >
            <div className="text-[var(--text-muted)] text-xs uppercase tracking-wide">
              {format(day, 'EEE')}
            </div>
            <div className={cn(
              'text-lg font-semibold mt-0.5',
              isToday(day) ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]',
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div className="flex overflow-y-auto">
        {/* Hour labels */}
        <div className="w-16 flex-shrink-0">
          {hours.map(h => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="flex items-start justify-end pr-2 pt-1">
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {h > 12 ? `${h - 12}p` : h === 12 ? '12p' : `${h}a`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map(day => {
          const key   = format(day, 'yyyy-MM-dd')
          const apts  = byDay[key] ?? []
          const today = isToday(day)

          return (
            <div
              key={key}
              className="flex-1 relative border-l border-[var(--border)]"
              style={{ height: TOTAL_HOURS * HOUR_HEIGHT, minWidth: 0 }}
            >
              {/* Hour lines */}
              {hours.map(h => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-[var(--border)]"
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                />
              ))}

              {/* Now line */}
              {today && nowTop >= 0 && (
                <div className="absolute left-0 right-0 z-10 h-px bg-red-500" style={{ top: nowTop }} />
              )}

              {/* Events */}
              {apts.map(apt => {
                const start  = new Date(apt.scheduled_at)
                const startH = start.getHours() + start.getMinutes() / 60
                const top    = (startH - START_HOUR) * HOUR_HEIGHT
                const height = Math.max((apt.duration / 60) * HOUR_HEIGHT, 20)

                return (
                  <Link
                    key={apt.id}
                    href={`/appointments/${apt.id}`}
                    className={cn(
                      'absolute inset-x-1 rounded overflow-hidden text-xs px-1 py-0.5 hover:opacity-90 transition-opacity cursor-pointer',
                      STATUS_BG[apt.status] ?? 'bg-gray-100',
                    )}
                    style={{ top: top + 1, height: height - 2 }}
                  >
                    <div className="font-medium truncate leading-tight">
                      {apt.patients?.full_name?.split(' ')[0] ?? '?'}
                    </div>
                    {height > 32 && (
                      <div className="opacity-70 truncate">
                        {format(start, 'h:mm')}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
