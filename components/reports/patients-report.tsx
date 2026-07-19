'use client'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Users, UserPlus } from 'lucide-react'

const COLORS = ['#3b82f6', '#ec4899', '#6b7280', '#f59e0b', '#8b5cf6', '#10b981']

function StatCard({ label, value, sub, icon: Icon, color = 'blue' }: any) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-400',
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

const GENDER_LABELS: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other', unknown: 'Unknown' }

export function PatientsReport({ data }: { data: any }) {
  const { summary, daily, byGender, byBloodGroup, byCity } = data
  const fmtDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getDate()}/${dt.getMonth() + 1}`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="New Patients" value={summary.newPatients} sub="In selected period" icon={UserPlus} color="blue" />
        <StatCard label="Total Patients" value={summary.totalPatients} sub="All time" icon={Users} color="green" />
      </div>

      {/* Registration trend */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-foreground mb-4">New Registrations Over Time</p>
        {daily.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No data for selected period</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily.map((d: any) => ({ ...d, date: fmtDate(d.date) }))}>
              <defs>
                <linearGradient id="patientsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" name="New Patients" stroke="#3b82f6" fill="url(#patientsGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gender */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-4">By Gender</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={byGender} dataKey="count" nameKey="gender" cx="50%" cy="50%" outerRadius={65}>
                {byGender.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                formatter={(v: any, _: any, p: any) => [v, GENDER_LABELS[p.payload.gender] ?? p.payload.gender]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {byGender.map((g: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground">{GENDER_LABELS[g.gender] ?? g.gender} ({g.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Blood group */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-4">By Blood Group</p>
          <div className="space-y-2 mt-2">
            {byBloodGroup.sort((a: any, b: any) => b.count - a.count).map((g: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-foreground">{g.group}</span>
                </div>
                <span className="text-muted-foreground">{g.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top cities */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-4">Top Cities</p>
          {byCity.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No city data</p>
          ) : (
            <div className="space-y-2.5">
              {byCity.slice(0, 8).map((c: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-foreground truncate">{c.city}</span>
                    <span className="text-muted-foreground">{c.count}</span>
                  </div>
                  <div className="h-1 bg-white/[0.05] rounded-full">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(c.count / byCity[0].count) * 100}%` }}
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
