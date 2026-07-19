'use client'
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { TrendingUp, DollarSign, CreditCard, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function StatCard({ label, value, sub, icon: Icon, color = 'blue' }: {
  label: string; value: string; sub?: string; icon: any; color?: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red: 'bg-red-500/10 text-red-400',
  }
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function RevenueReport({ data }: { data: any }) {
  const { summary, daily, byMethod, byDoctor } = data

  const fmtDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getDate()}/${dt.getMonth() + 1}`
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Invoiced"
          value={formatCurrency(summary.totalInvoiced)}
          sub={`${summary.invoiceCount} invoices`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          label="Total Collected"
          value={formatCurrency(summary.totalCollected)}
          sub={`${summary.paidCount} paid`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(summary.outstanding)}
          sub="Unpaid balance"
          icon={AlertCircle}
          color="amber"
        />
        <StatCard
          label="Collection Rate"
          value={summary.totalInvoiced > 0
            ? `${Math.round((summary.totalCollected / summary.totalInvoiced) * 100)}%`
            : '0%'}
          sub="vs invoiced"
          icon={CreditCard}
          color="blue"
        />
      </div>

      {/* Daily chart */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-foreground mb-4">Revenue Over Time</p>
        {daily.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No data for selected period</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={daily.map((d: any) => ({ ...d, date: fmtDate(d.date) }))}>
              <defs>
                <linearGradient id="invoicedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#9ca3af', fontSize: 12 }}
                formatter={(v: any) => [formatCurrency(v), '']}
              />
              <Legend />
              <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#3b82f6" fill="url(#invoicedGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" fill="url(#collectedGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By method */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-4">By Payment Method</p>
          {byMethod.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No payments in period</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byMethod} dataKey="amount" nameKey="method" cx="50%" cy="50%" outerRadius={80} label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {byMethod.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  formatter={(v: any) => [formatCurrency(v), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By doctor */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-4">Revenue by Doctor</p>
          {byDoctor.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No data</p>
          ) : (
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {byDoctor.map((d: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground truncate max-w-[60%]">{d.name}</span>
                    <span className="text-muted-foreground">{formatCurrency(d.collected)}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${byDoctor[0].invoiced > 0 ? (d.invoiced / byDoctor[0].invoiced) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
