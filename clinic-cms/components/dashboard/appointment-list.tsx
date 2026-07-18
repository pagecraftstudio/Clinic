'use client'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Clock, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { AppointmentBadge } from '@/components/shared/status-badge'

export function TodayAppointments() {
  const router = useRouter()

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('v_today_queue')
        .select('*')
        .limit(8)
      return data ?? []
    },
    refetchInterval: 60_000,
  })

  return (
    <div
      className="rounded-xl"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Clock size={15} style={{ color: 'var(--text-muted)' }} />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Today&apos;s Queue
          </span>
          {appointments && (
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              {appointments.length}
            </span>
          )}
        </div>
        <button
          onClick={() => router.push('/appointments')}
          className="text-[12px] font-medium flex items-center gap-1 transition-colors hover:opacity-80"
          style={{ color: 'var(--accent)' }}
        >
          View all <ChevronRight size={13} />
        </button>
      </div>

      {/* List */}
      <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-2.5 w-20 rounded" />
                </div>
              </div>
            ))
          : appointments?.length === 0
          ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                No appointments today
              </p>
            </div>
          )
          : appointments?.map((appt) => (
            <button
              key={appt.id}
              onClick={() => router.push(`/appointments/${appt.id}`)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--bg-subtle)]"
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                {appt.patient_name?.[0]?.toUpperCase() ?? 'P'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {appt.patient_name}
                </p>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {appt.doctor_name} · {formatDate(appt.scheduled_at, 'time')}
                </p>
              </div>

              {/* Status */}
              <AppointmentBadge status={appt.status} />
            </button>
          ))}
      </div>
    </div>
  )
}
