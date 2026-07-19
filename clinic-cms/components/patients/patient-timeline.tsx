import Link from 'next/link'
import {
  Stethoscope, CalendarClock, Pill, Receipt, FlaskConical, Scan, FileText,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/shared/empty-state'
import type { PatientTimelineEvent } from '@/types/patient'

const ICONS: Record<PatientTimelineEvent['type'], typeof Stethoscope> = {
  visit: Stethoscope,
  appointment: CalendarClock,
  prescription: Pill,
  invoice: Receipt,
  lab_order: FlaskConical,
  radiology_order: Scan,
  document: FileText,
}

export function PatientTimeline({ events }: { events: PatientTimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No activity yet"
        description="Visits, appointments, and billing events will appear here."
      />
    )
  }

  return (
    <div className="flex flex-col">
      {events.map((event, i) => {
        const Icon = ICONS[event.type]
        const Wrapper = event.href ? Link : 'div'
        return (
          <Wrapper
            key={event.id}
            href={event.href as string}
            className="flex gap-3 px-5 py-3.5 border-b last:border-0 hover:bg-[var(--bg-subtle)] transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-light)' }}
              >
                <Icon size={13} style={{ color: 'var(--accent)' }} />
              </div>
              {i < events.length - 1 && (
                <div className="w-px flex-1 mt-1" style={{ background: 'var(--border)' }} />
              )}
            </div>
            <div className="flex-1 pb-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{event.title}</p>
                <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(event.occurred_at, 'datetime')}
                </span>
              </div>
              {event.subtitle && (
                <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>{event.subtitle}</p>
              )}
              {event.status && (
                <span className="text-[11px] font-medium capitalize" style={{ color: 'var(--text-muted)' }}>
                  {event.status.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </Wrapper>
        )
      })}
    </div>
  )
}
