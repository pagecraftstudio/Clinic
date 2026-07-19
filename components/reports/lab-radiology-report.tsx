'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { FlaskConical, Scan } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const STATUS_LABELS: Record<string, string> = {
  requested: 'Requested', sample_collected: 'Sample Collected', processing: 'Processing',
  completed: 'Completed', cancelled: 'Cancelled', scheduled: 'Scheduled',
}
const MODALITY_LABELS: Record<string, string> = {
  xray: 'X-Ray', mri: 'MRI', ct: 'CT Scan', ultrasound: 'Ultrasound', other: 'Other',
}

function MiniStat({ label, value, icon: Icon }: any) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/10 text-blue-400">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export function LabReport({ data }: { data: any }) {
  const { summary, byStatus, topTests } = data
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <MiniStat label="Total Lab Requests" value={summary.total} icon={FlaskConical} />
        <MiniStat label="Completed" value={summary.completed} icon={FlaskConical} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-4">By Status</p>
          {byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No data</p>
          ) : (
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={byStatus} dataKey="count" cx="50%" cy="50%" outerRadius={65}>
                    {byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    formatter={(v: any, _: any, p: any) => [v, STATUS_LABELS[p.payload.status] ?? p.payload.status]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {byStatus.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-foreground">{STATUS_LABELS[s.status] ?? s.status}</span>
                    </div>
                    <span className="text-muted-foreground">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-4">Top Tests</p>
          {topTests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topTests} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="test" tick={{ fill: '#9ca3af', fontSize: 10 }} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export function RadiologyReport({ data }: { data: any }) {
  const { summary, byStatus, byModality } = data
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <MiniStat label="Total Orders" value={summary.total} icon={Scan} />
        <MiniStat label="Completed" value={summary.completed} icon={Scan} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-4">By Status</p>
          {byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No data</p>
          ) : (
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={byStatus} dataKey="count" cx="50%" cy="50%" outerRadius={65}>
                    {byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    formatter={(v: any, _: any, p: any) => [v, STATUS_LABELS[p.payload.status] ?? p.payload.status]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {byStatus.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-foreground">{STATUS_LABELS[s.status] ?? s.status}</span>
                    </div>
                    <span className="text-muted-foreground">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-4">By Modality</p>
          {byModality.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No data</p>
          ) : (
            <div className="space-y-3 mt-2">
              {byModality.map((m: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground">{MODALITY_LABELS[m.modality] ?? m.modality}</span>
                    <span className="text-muted-foreground">{m.count}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(m.count / Math.max(...byModality.map((x: any) => x.count))) * 100}%`,
                        background: COLORS[i % COLORS.length],
                      }}
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
