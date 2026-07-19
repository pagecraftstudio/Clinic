'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

type Period = '7d' | '30d' | '90d'

const PERIOD_LABELS: Record<Period, string> = {
  '7d':  'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 3 months',
}

function getDateRange(period: Period): { start: string; end: string; group: string } {
  const end   = new Date()
  const start = new Date()
  if (period === '7d')  { start.setDate(end.getDate() - 7);  return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10), group: 'day' } }
  if (period === '30d') { start.setDate(end.getDate() - 30); return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10), group: 'day' } }
  start.setDate(end.getDate() - 90)
  return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10), group: 'week' }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg p-3 text-[12px] shadow-lg"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <p style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>('30d')
  const { start, end, group } = getDateRange(period)

  const { data, isLoading } = useQuery({
    queryKey: ['revenue-chart', period],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase.rpc('get_revenue_by_period', {
        p_start: start, p_end: end, p_group: group,
      })
      return (data ?? []).map((row: any) => ({
        period: row.period,
        revenue: Number(row.revenue),
      }))
    },
  })

  const total = data?.reduce((sum, r) => sum + r.revenue, 0) ?? 0

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>Revenue</p>
          <p className="text-[24px] font-bold tracking-tight mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(total)}
          </p>
        </div>
        <div
          className="flex rounded-lg p-0.5 gap-0.5"
          style={{ background: 'var(--bg-subtle)' }}
        >
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-md transition-all"
              style={{
                background: period === p ? 'var(--bg-surface)' : 'transparent',
                color: period === p ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: period === p ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        {isLoading ? (
          <div className="h-full skeleton rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#2563EB', stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
