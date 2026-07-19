'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Package, AlertTriangle, Clock, XCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

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

export function InventoryReport({ data }: { data: any }) {
  const { summary, lowStock, expiringSoon, expired, byCategory } = data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={summary.totalItems} sub="Active items" icon={Package} color="blue" />
        <StatCard label="Low Stock" value={summary.lowStockCount} sub="Below minimum" icon={AlertTriangle} color="amber" />
        <StatCard label="Expiring Soon" value={summary.expiringSoonCount} sub="Within 30 days" icon={Clock} color="amber" />
        <StatCard label="Expired" value={summary.expiredCount} sub="Needs action" icon={XCircle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Value by category */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-foreground">Value by Category</p>
            <p className="text-xs text-muted-foreground">Total: {formatCurrency(summary.totalValue)}</p>
          </div>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No data</p>
          ) : (
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width="40%" height={160}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" cx="50%" cy="50%" outerRadius={65}>
                    {byCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1d26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    formatter={(v: any) => [formatCurrency(v as number), 'Value']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {byCategory.slice(0, 6).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-foreground truncate max-w-[100px]">{c.category}</span>
                    </div>
                    <span className="text-muted-foreground">{c.count} items</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Low stock alert */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle size={14} /> Low Stock Items
          </p>
          {lowStock.length === 0 ? (
            <p className="text-xs text-muted-foreground">All items adequately stocked</p>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {lowStock.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate max-w-[60%]">{item.name}</span>
                  <div className="flex gap-2 text-right">
                    <span className="text-red-400">{item.quantity} left</span>
                    <span className="text-muted-foreground">/ {item.min_quantity} min</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expiring soon */}
      {expiringSoon.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Clock size={14} className="text-amber-400" /> Expiring Within 30 Days
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-white/[0.06]">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {expiringSoon.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2 text-foreground">{item.name}</td>
                    <td className="py-2 text-muted-foreground">{item.category}</td>
                    <td className="py-2 text-right text-foreground">{item.quantity}</td>
                    <td className="py-2 text-right text-amber-400">
                      {new Date(item.expiry_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
