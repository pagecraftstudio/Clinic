'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  format, addDays, subDays, addWeeks, subWeeks,
  addMonths, subMonths, startOfWeek, startOfMonth,
  parseISO,
} from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, Filter, RotateCcw } from 'lucide-react'
import { useAppointments, useDoctors } from '@/features/appointments/hooks'
import { CalendarDayView }    from '@/components/appointments/calendar-day-view'
import { CalendarWeekView }   from '@/components/appointments/calendar-week-view'
import { CalendarMonthView }  from '@/components/appointments/calendar-month-view'
import { CalendarAgendaView } from '@/components/appointments/calendar-agenda-view'
import { cn } from '@/lib/utils'
import type { AppointmentStatus, AppointmentType } from '@/types/appointment'

type CalView = 'day' | 'week' | 'month' | 'agenda'

const VIEWS: { value: CalView; label: string }[] = [
  { value: 'day',    label: 'Day' },
  { value: 'week',   label: 'Week' },
  { value: 'month',  label: 'Month' },
  { value: 'agenda', label: 'Agenda' },
]

const STATUS_OPTS: { value: AppointmentStatus; label: string }[] = [
  { value: 'scheduled',   label: 'Scheduled' },
  { value: 'confirmed',   label: 'Confirmed' },
  { value: 'checked_in',  label: 'Checked In' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
  { value: 'no_show',     label: 'No Show' },
]

const TYPE_OPTS: { value: AppointmentType; label: string }[] = [
  { value: 'in_person', label: 'In Person' },
  { value: 'online',    label: 'Online' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'urgent',    label: 'Urgent' },
  { value: 'routine',   label: 'Routine' },
]

export function AppointmentsCalendarClient() {
  const [view,      setView]      = useState<CalView>('week')
  const [current,   setCurrent]   = useState(new Date())
  const [doctorId,  setDoctorId]  = useState('')
  const [status,    setStatus]    = useState<AppointmentStatus | ''>('')
  const [apptType,  setApptType]  = useState<AppointmentType | ''>('')
  const [showFilter, setShowFilter] = useState(false)

  const { data: doctors = [] } = useDoctors()

  // Build query filters from view + current date
  const queryFilters = useCallback(() => {
    const base = {
      doctor_id: doctorId || undefined,
      status:    status   || undefined,
      type:      apptType || undefined,
      pageSize:  200,
    }
    if (view === 'day') {
      return { ...base, date: format(current, 'yyyy-MM-dd') }
    }
    if (view === 'week') {
      const ws = startOfWeek(current, { weekStartsOn: 0 })
      return { ...base, week_start: format(ws, 'yyyy-MM-dd') }
    }
    if (view === 'month') {
      return { ...base, month: format(current, 'yyyy-MM') }
    }
    // agenda: next 30 days
    return { ...base, week_start: format(current, 'yyyy-MM-dd') }
  }, [view, current, doctorId, status, apptType])

  const { data, isLoading } = useAppointments(queryFilters())
  const appointments = data?.data ?? []

  // Navigation
  function navigate(dir: 'prev' | 'next') {
    setCurrent(c => {
      if (view === 'day')   return dir === 'next' ? addDays(c, 1)    : subDays(c, 1)
      if (view === 'week')  return dir === 'next' ? addWeeks(c, 1)   : subWeeks(c, 1)
      if (view === 'month') return dir === 'next' ? addMonths(c, 1)  : subMonths(c, 1)
      return dir === 'next' ? addWeeks(c, 1) : subWeeks(c, 1)
    })
  }

  function headerLabel() {
    if (view === 'day')   return format(current, 'MMMM d, yyyy')
    if (view === 'week') {
      const ws = startOfWeek(current, { weekStartsOn: 0 })
      const we = addDays(ws, 6)
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`
    }
    if (view === 'month') return format(current, 'MMMM yyyy')
    return 'Agenda'
  }

  const hasFilters = !!doctorId || !!status || !!apptType

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-[var(--border)] flex-wrap">
        {/* Nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('prev')}
            className="p-2 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setCurrent(new Date())}
            className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigate('next')}
            className="p-2 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Date label */}
        <h2 className="font-semibold text-[var(--text-primary)] text-lg min-w-0">
          {headerLabel()}
        </h2>

        <div className="flex-1" />

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilter(v => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
            hasFilters
              ? 'bg-[var(--accent-light)] border-[var(--accent-border)] text-[var(--accent)]'
              : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]',
          )}
        >
          <Filter className="size-3.5" />
          Filters
          {hasFilters && <span className="size-4 flex items-center justify-center bg-[var(--accent)] text-white rounded-full text-[10px] font-bold">!</span>}
        </button>

        {/* View switcher */}
        <div className="flex items-center bg-[var(--bg-subtle)] rounded-lg p-0.5">
          {VIEWS.map(v => (
            <button
              key={v.value}
              onClick={() => setView(v.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                view === v.value
                  ? 'bg-white shadow-sm text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* New appointment */}
        <Link
          href="/appointments/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          <Plus className="size-4" />
          New
        </Link>
      </div>

      {/* Filter bar */}
      {showFilter && (
        <div className="flex items-center gap-3 px-6 py-3 bg-[var(--bg-subtle)] border-b border-[var(--border)] flex-wrap">
          <select
            value={doctorId}
            onChange={e => setDoctorId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">All Doctors</option>
            {doctors.map((d: { id: string; specialty: string; profiles: { display_name: string } }) => (
              <option key={d.id} value={d.id}>{d.profiles?.display_name}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={e => setStatus(e.target.value as AppointmentStatus | '')}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <select
            value={apptType}
            onChange={e => setApptType(e.target.value as AppointmentType | '')}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">All Types</option>
            {TYPE_OPTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setDoctorId(''); setStatus(''); setApptType('') }}
              className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <RotateCcw className="size-3" /> Reset
            </button>
          )}
        </div>
      )}

      {/* Calendar body */}
      <div className="flex-1 overflow-hidden bg-white relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center">
            <div className="size-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div className="h-full overflow-hidden">
          {view === 'day' && (
            <div className="h-full overflow-y-auto">
              <CalendarDayView date={current} appointments={appointments} />
            </div>
          )}
          {view === 'week' && (
            <div className="h-full">
              <CalendarWeekView
                weekStart={startOfWeek(current, { weekStartsOn: 0 })}
                appointments={appointments}
              />
            </div>
          )}
          {view === 'month' && (
            <div className="h-full overflow-y-auto">
              <CalendarMonthView
                month={current}
                appointments={appointments}
                onDayClick={day => { setCurrent(day); setView('day') }}
              />
            </div>
          )}
          {view === 'agenda' && (
            <div className="h-full overflow-y-auto p-6">
              <CalendarAgendaView appointments={appointments} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
