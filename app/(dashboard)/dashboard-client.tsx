'use client'
import { motion } from 'framer-motion'
import {
  Calendar, Users, DollarSign, TrendingUp,
  UserCheck, FlaskConical, Package, Activity,
  Clock, AlertTriangle, CheckCircle,
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TodayAppointments } from '@/components/dashboard/appointment-list'
import { DoctorPerformanceChart } from '@/components/dashboard/doctor-chart'
import { LowStockAlert } from '@/components/dashboard/low-stock'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DashboardStats {
  today_appointments:       number
  today_completed:          number
  today_cancelled:          number
  today_no_show:            number
  today_revenue:            number
  month_revenue:            number
  total_patients:           number
  new_patients_today:       number
  new_patients_month:       number
  pending_lab_orders:       number
  pending_radiology_orders: number
  low_stock_items:          number
  outstanding_balance:      number
  upcoming_appointments:    number
  unread_notifications:     number
}

interface Props {
  stats: DashboardStats | null
  recentActivity: any[]
}

const STAT_CARDS = (s: DashboardStats) => [
  {
    title:     "Today's Appointments",
    value:     s.today_appointments,
    change:    { value: s.today_completed, label: 'completed' },
    icon:      Calendar,
    iconColor: '#2563EB',
    iconBg:    '#EFF6FF',
    trend:     'neutral' as const,
  },
  {
    title:     'Month Revenue',
    value:     formatCurrency(s.month_revenue),
    change:    { value: s.today_revenue, label: `today` },
    icon:      DollarSign,
    iconColor: '#059669',
    iconBg:    '#ECFDF5',
    trend:     'up' as const,
  },
  {
    title:     'Total Patients',
    value:     s.total_patients,
    change:    { value: s.new_patients_month, label: 'new this month' },
    icon:      Users,
    iconColor: '#7C3AED',
    iconBg:    '#F5F3FF',
    trend:     'up' as const,
  },
  {
    title:     'Upcoming (7d)',
    value:     s.upcoming_appointments,
    icon:      Clock,
    iconColor: '#0284C7',
    iconBg:    '#F0F9FF',
    trend:     'neutral' as const,
  },
  {
    title:     'Pending Lab',
    value:     s.pending_lab_orders,
    icon:      FlaskConical,
    iconColor: '#D97706',
    iconBg:    '#FFFBEB',
    trend:     s.pending_lab_orders > 10 ? 'down' as const : 'neutral' as const,
  },
  {
    title:     'Low Stock Items',
    value:     s.low_stock_items,
    icon:      Package,
    iconColor: s.low_stock_items > 0 ? '#DC2626' : '#059669',
    iconBg:    s.low_stock_items > 0 ? '#FEF2F2' : '#ECFDF5',
    trend:     s.low_stock_items > 0 ? 'down' as const : 'neutral' as const,
  },
  {
    title:     'Outstanding Balance',
    value:     formatCurrency(s.outstanding_balance),
    icon:      AlertTriangle,
    iconColor: '#D97706',
    iconBg:    '#FFFBEB',
    trend:     'neutral' as const,
  },
  {
    title:     'New Patients Today',
    value:     s.new_patients_today,
    icon:      UserCheck,
    iconColor: '#059669',
    iconBg:    '#ECFDF5',
    trend:     'up' as const,
  },
]

const ACTION_TABLE: Record<string, { label: string; color: string }> = {
  INSERT: { label: 'Created',  color: '#059669' },
  UPDATE: { label: 'Updated',  color: '#D97706' },
  DELETE: { label: 'Deleted',  color: '#DC2626' },
  login:  { label: 'Logged in', color: '#2563EB' },
}

const TABLE_LABELS: Record<string, string> = {
  patients:     'patient',
  appointments: 'appointment',
  invoices:     'invoice',
  visits:       'visit',
  prescriptions:'prescription',
  payments:     'payment',
  lab_orders:   'lab order',
}

export function DashboardClient({ stats, recentActivity }: Props) {
  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {greeting} · {formatDate(today, 'short')}
        </p>
        <h1 className="text-[22px] font-bold tracking-tight mt-0.5" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
      </motion.div>

      {/* KPI grid */}
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STAT_CARDS(stats).map((card, i) => (
            <StatsCard key={card.title} {...card} index={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-5 space-y-3 animate-pulse"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="h-3 rounded" style={{ background: 'var(--bg-muted)', width: '60%' }} />
              <div className="h-7 rounded" style={{ background: 'var(--bg-muted)', width: '40%' }} />
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <DoctorPerformanceChart />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's queue */}
        <div className="lg:col-span-2">
          <TodayAppointments />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <LowStockAlert />

          {/* Recent activity */}
          <div
            className="rounded-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="flex items-center gap-2 px-5 py-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <Activity size={15} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Recent Activity
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {recentActivity.length === 0 ? (
                <p className="px-5 py-8 text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  No recent activity
                </p>
              ) : (
                recentActivity.slice(0, 6).map((log) => {
                  const action = ACTION_TABLE[log.action] ?? { label: log.action, color: 'var(--text-muted)' }
                  const table  = TABLE_LABELS[log.table_name] ?? log.table_name
                  return (
                    <div key={log.id} className="flex items-center gap-3 px-5 py-2.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: action.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px]" style={{ color: 'var(--text-primary)' }}>
                          <span className="font-medium" style={{ color: action.color }}>
                            {action.label}
                          </span>
                          {' '}{table}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(log.created_at, 'relative')}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
