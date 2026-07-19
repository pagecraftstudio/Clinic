'use client'
import { useState, useTransition } from 'react'
import { format, subDays } from 'date-fns'
import {
  BarChart3, DollarSign, Calendar, Users, Package, FlaskConical, Scan,
  Download, RefreshCw, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RevenueReport } from '@/components/reports/revenue-report'
import { AppointmentsReport } from '@/components/reports/appointments-report'
import { PatientsReport } from '@/components/reports/patients-report'
import { InventoryReport } from '@/components/reports/inventory-report'
import { LabReport, RadiologyReport } from '@/components/reports/lab-radiology-report'
import { toast } from 'sonner'
import type { ReportTab, DatePreset } from '@/types/reports'

const TABS: { id: ReportTab; label: string; icon: any }[] = [
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'lab', label: 'Laboratory', icon: FlaskConical },
  { id: 'radiology', label: 'Radiology', icon: Scan },
]

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: '365d', label: '1 year' },
  { id: 'custom', label: 'Custom' },
]

function getRange(preset: DatePreset, customFrom: string, customTo: string) {
  const today = format(new Date(), 'yyyy-MM-dd')
  if (preset === '7d') return { from: format(subDays(new Date(), 7), 'yyyy-MM-dd'), to: today }
  if (preset === '30d') return { from: format(subDays(new Date(), 30), 'yyyy-MM-dd'), to: today }
  if (preset === '90d') return { from: format(subDays(new Date(), 90), 'yyyy-MM-dd'), to: today }
  if (preset === '365d') return { from: format(subDays(new Date(), 365), 'yyyy-MM-dd'), to: today }
  return { from: customFrom, to: customTo }
}

interface Props {
  initialTab: ReportTab
  initialData: any
  initialFrom: string
  initialTo: string
}

export function ReportsClient({ initialTab, initialData, initialFrom, initialTo }: Props) {
  const [tab, setTab] = useState<ReportTab>(initialTab)
  const [preset, setPreset] = useState<DatePreset>('30d')
  const [customFrom, setCustomFrom] = useState(initialFrom)
  const [customTo, setCustomTo] = useState(initialTo)
  const [data, setData] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  async function fetchData(newTab: ReportTab, newPreset: DatePreset, from: string, to: string) {
    const range = getRange(newPreset, from, to)
    try {
      const params = new URLSearchParams({ tab: newTab, from: range.from, to: range.to })
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch {
      toast.error('Failed to load report data')
    }
  }

  function handleTabChange(newTab: ReportTab) {
    setTab(newTab)
    startTransition(() => {
      fetchData(newTab, preset, customFrom, customTo)
    })
  }

  function handlePresetChange(newPreset: DatePreset) {
    setPreset(newPreset)
    if (newPreset !== 'custom') {
      startTransition(() => {
        fetchData(tab, newPreset, customFrom, customTo)
      })
    }
  }

  function handleCustomApply() {
    startTransition(() => {
      fetchData(tab, 'custom', customFrom, customTo)
    })
  }

  async function handleExportCSV() {
    const range = getRange(preset, customFrom, customTo)
    try {
      const params = new URLSearchParams({ tab, from: range.from, to: range.to, format: 'csv' })
      const res = await fetch(`/api/reports/export?${params}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${tab}-${range.from}-${range.to}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Report exported')
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06] flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-400" />
            Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Analytics and export for all clinic modules</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => startTransition(() => fetchData(tab, preset, customFrom, customTo))}
            className="h-8 px-3 rounded-lg border border-white/[0.08] text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.05] flex items-center gap-1.5 transition-colors"
            disabled={isPending}
          >
            <RefreshCw size={12} className={cn(isPending && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white flex items-center gap-1.5 transition-colors"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs + Date controls */}
      <div className="px-6 pt-4 pb-0 flex flex-col gap-3 flex-shrink-0">
        {/* Tab bar */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                tab === id
                  ? 'bg-blue-600 text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
              )}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Date presets — hidden for inventory (no date range) */}
        {tab !== 'inventory' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  className={cn(
                    'h-7 px-2.5 rounded-md text-xs transition-colors',
                    preset === p.id
                      ? 'bg-white/[0.1] text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="h-7 px-2 rounded-md border border-white/[0.1] bg-white/[0.03] text-xs text-foreground"
                />
                <span className="text-xs text-muted-foreground">—</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="h-7 px-2 rounded-md border border-white/[0.1] bg-white/[0.03] text-xs text-foreground"
                />
                <button
                  onClick={handleCustomApply}
                  className="h-7 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-xs text-white transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report content */}
      <div className={cn('flex-1 overflow-y-auto p-6 transition-opacity', isPending && 'opacity-50 pointer-events-none')}>
        {data ? (
          <>
            {tab === 'revenue' && <RevenueReport data={data} />}
            {tab === 'appointments' && <AppointmentsReport data={data} />}
            {tab === 'patients' && <PatientsReport data={data} />}
            {tab === 'inventory' && <InventoryReport data={data} />}
            {tab === 'lab' && <LabReport data={data} />}
            {tab === 'radiology' && <RadiologyReport data={data} />}
          </>
        ) : (
          <div className="flex items-center justify-center h-48">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
