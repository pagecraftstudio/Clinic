'use client'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Calendar, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled', confirmed: 'Confirmed', checked_in: 'Checked In',
  in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
  no_show: 'No Show', rescheduled: 'Rescheduled',
}
const TYPE_LABELS: Record<string, string> = {
  in_person: 'In Person', online: 'Online', follow_up: 'Follow-up',
  urgent: 'Urgent', routine: 'Routine',
}

function StatCard({ label, value, sub, icon: Icon, color = 'blue' }: any) {
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

export function AppointmentsReport({ data }: { data: any }) {
  const { summary, daily, byStatus, byType, byDoctor } = data
  const fmtDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getDate()}/${dt.getMonth() + 1}`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={summary.total} sub="Appointments" icon={Calendar} color="blue" />
        <StatCard label="Completed" value={summary.completed} sub={`${summary.completionRate}% rate`} icon={CheckCircle2} color="green" />
        <StatCard label="No Shows" value={summary.no_show} sub={`${summary.noShowRate}% rate`} icon={AlertTriangle} color="amber" />
        <StatCard label="Cancelled" value={summary.cancelled} sub="Cancellations" icon={XCircle} color="red" />
      </div>

      {/* Daily trend */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-foreground mb-4">Daily Appointments</p>
        {daily.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No data for selected period</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={daily.map((d: any) => ({ ...d, date: fmtDate(d.date) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[3, 3, 0, 0]} stackId="a" />
              <Bar dataKey="no_show" name="No Show" fill="#f59e0b" radius={[0, 0, 0, 0]} stackId="a" />
              <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" radius={[0, 0, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* By status pie */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-4">By Status</p>
          {byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70}>
                  {byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  formatter={(v: any, _: any, p: any) => [v, STATUS_LABELS[p.payload.status] ?? p.payload.status]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By type */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-4">By Type</p>
          <div className="space-y-2.5 mt-2">
            {byType.map((t: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground">{TYPE_LABELS[t.type] ?? t.type}</span>
                  <span className="text-muted-foreground">{t.count}</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(t.count / summary.total) * 100}%`, background: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By doctor */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-4">By Doctor</p>
          <div className="space-y-2.5 overflow-y-auto max-h-[180px]">
            {byDoctor.map((d: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-foreground truncate max-w-[55%]">{d.name}</span>
                <div className="flex gap-3 text-right">
                  <span className="text-emerald-400">{d.completed} done</span>
                  <span className="text-amber-400">{d.no_show} NS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
