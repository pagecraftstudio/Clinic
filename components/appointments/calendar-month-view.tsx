'use client'

import { useMemo } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameDay, isSameMonth, isToday,
} from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types/appointment'

const STATUS_DOT: Record<string, string> = {
  scheduled:   'bg-indigo-400',
  confirmed:   'bg-sky-400',
  checked_in:  'bg-emerald-400',
  in_progress: 'bg-amber-400',
  completed:   'bg-gray-400',
  cancelled:   'bg-red-400',
  no_show:     'bg-gray-300',
  rescheduled: 'bg-purple-400',
}

interface Props {
  month: Date        // any day in the target month
  appointments: Appointment[]
  onDayClick?: (date: Date) => void
}

export function CalendarMonthView({ month, appointments, onDayClick }: Props) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    const end   = endOfWeek(endOfMonth(month),     { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    appointments.forEach(a => {
      const key = format(new Date(a.scheduled_at), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(a)
    })
    return map
  }, [appointments])

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="flex flex-col h-full select-none">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[var(--border)]">
        {weekDays.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: '1fr' }}>
        {days.map(day => {
          const key  = format(day, 'yyyy-MM-dd')
          const apts = byDay[key] ?? []
          const inMonth = isSameMonth(day, month)
          const today   = isToday(day)

          return (
            <div
              key={key}
              onClick={() => onDayClick?.(day)}
              className={cn(
                'border-b border-r border-[var(--border)] p-2 min-h-[90px] cursor-pointer transition-colors',
                !inMonth && 'bg-[var(--bg-subtle)] opacity-50',
                inMonth  && 'hover:bg-[var(--accent-light)]',
                today    && 'bg-blue-50',
              )}
            >
              {/* Day number */}
              <div className={cn(
                'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1',
                today
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-primary)]',
              )}>
                {format(day, 'd')}
              </div>

              {/* Appointment pills */}
              <div className="space-y-0.5 overflow-hidden">
                {apts.slice(0, 3).map(apt => (
                  <Link
                    key={apt.id}
                    href={`/appointments/${apt.id}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs hover:opacity-80 transition-opacity bg-white border border-[var(--border)] truncate"
                  >
                    <span className={cn('size-1.5 flex-shrink-0 rounded-full', STATUS_DOT[apt.status])} />
                    <span className="truncate text-[var(--text-primary)]">
                      {format(new Date(apt.scheduled_at), 'h:mm')} {apt.patients?.full_name?.split(' ')[0]}
                    </span>
                  </Link>
                ))}
                {apts.length > 3 && (
                  <div className="text-xs text-[var(--text-muted)] pl-1">
                    +{apts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
