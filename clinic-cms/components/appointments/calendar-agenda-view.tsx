'use client'

import { useMemo } from 'react'
import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import type { Appointment } from '@/types/appointment'
import { AppointmentCard } from './appointment-card'
import { CalendarX } from 'lucide-react'

interface Props {
  appointments: Appointment[]
}

function dayLabel(date: Date) {
  if (isToday(date))     return 'Today'
  if (isTomorrow(date))  return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d')
}

export function CalendarAgendaView({ appointments }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    appointments.forEach(a => {
      const key = format(new Date(a.scheduled_at), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    })
    return Array.from(map.entries()).map(([key, apts]) => ({
      key,
      date: new Date(key + 'T12:00:00'),
      apts: apts.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    }))
  }, [appointments])

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <CalendarX className="size-10 text-[var(--text-muted)]" />
        <p className="text-[var(--text-secondary)] font-medium">No appointments</p>
        <p className="text-sm text-[var(--text-muted)]">Try changing the date range or filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 overflow-y-auto pb-8">
      {groups.map(({ key, date, apts }) => (
        <section key={key}>
          <div className="flex items-center gap-3 mb-3 sticky top-0 bg-[var(--bg-base)] py-2 z-10">
            <div className={
              isToday(date)
                ? 'px-3 py-1 rounded-full bg-[var(--accent)] text-white text-sm font-semibold'
                : 'text-sm font-semibold text-[var(--text-primary)]'
            }>
              {dayLabel(date)}
            </div>
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-muted)]">{apts.length} appt{apts.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {apts.map(apt => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
