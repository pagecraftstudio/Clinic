'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, X, Users, Calendar, Receipt, Package, FlaskConical,
  Scan, UserCog, BarChart3, Sparkles, Settings, Plus, ArrowRight,
  LayoutDashboard, ClipboardList, Pill,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'

interface CommandItem {
  id: string
  label: string
  sublabel?: string
  icon: React.ElementType
  action: () => void
  group: string
  keywords?: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const { t } = useLang()
  const [query, setQuery] = useState('')
  const [patientResults, setPatientResults] = useState<Array<{ id: string; full_name: string; phone: string; patient_number: string }>>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const go = useCallback((href: string) => {
    router.push(href)
    onClose()
  }, [router, onClose])

  const STATIC_COMMANDS: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard',    group: t('Navigation', 'التنقل'),  icon: LayoutDashboard, label: t('Dashboard', 'لوحة التحكم'),        action: () => go('/'),              keywords: 'home main' },
    { id: 'nav-reception',    group: t('Navigation', 'التنقل'),  icon: ClipboardList,   label: t('Reception', 'الاستقبال'),           action: () => go('/reception'),     keywords: 'front desk' },
    { id: 'nav-patients',     group: t('Navigation', 'التنقل'),  icon: Users,           label: t('Patients', 'المرضى'),               action: () => go('/patients'),      keywords: '' },
    { id: 'nav-appointments', group: t('Navigation', 'التنقل'),  icon: Calendar,        label: t('Appointments', 'المواعيد'),          action: () => go('/appointments'),  keywords: 'schedule calendar' },
    { id: 'nav-doctors',      group: t('Navigation', 'التنقل'),  icon: UserCog,         label: t('Doctors', 'الأطباء'),               action: () => go('/doctors'),       keywords: 'staff physician' },
    { id: 'nav-lab',          group: t('Navigation', 'التنقل'),  icon: FlaskConical,    label: t('Laboratory', 'المختبر'),            action: () => go('/lab'),           keywords: 'test results' },
    { id: 'nav-radiology',    group: t('Navigation', 'التنقل'),  icon: Scan,            label: t('Radiology', 'الأشعة'),              action: () => go('/radiology'),     keywords: 'xray scan imaging' },
    { id: 'nav-billing',      group: t('Navigation', 'التنقل'),  icon: Receipt,         label: t('Billing', 'الفواتير'),              action: () => go('/billing'),       keywords: 'invoice payment finance' },
    { id: 'nav-inventory',    group: t('Navigation', 'التنقل'),  icon: Package,         label: t('Inventory', 'المخزون'),             action: () => go('/inventory'),     keywords: 'stock supply' },
    { id: 'nav-prescriptions',group: t('Navigation', 'التنقل'),  icon: Pill,            label: t('Prescriptions', 'الوصفات'),         action: () => go('/prescriptions'), keywords: 'rx medication' },
    { id: 'nav-ai',           group: t('Navigation', 'التنقل'),  icon: Sparkles,        label: t('AI Assistant', 'المساعد الذكي'),    action: () => go('/ai'),            keywords: 'chat gpt assistant' },
    { id: 'nav-reports',      group: t('Navigation', 'التنقل'),  icon: BarChart3,       label: t('Reports', 'التقارير'),              action: () => go('/reports'),       keywords: 'analytics stats' },
    { id: 'nav-settings',     group: t('Navigation', 'التنقل'),  icon: Settings,        label: t('Settings', 'الإعدادات'),            action: () => go('/settings'),      keywords: 'configuration' },
    // Quick actions
    { id: 'act-new-patient',  group: t('Quick Actions', 'إجراءات سريعة'), icon: Plus, label: t('New Patient', 'مريض جديد'),           action: () => go('/patients/new'),         keywords: 'create register add' },
    { id: 'act-new-appt',     group: t('Quick Actions', 'إجراءات سريعة'), icon: Plus, label: t('New Appointment', 'موعد جديد'),       action: () => go('/appointments/new'),     keywords: 'create schedule book' },
    { id: 'act-new-invoice',  group: t('Quick Actions', 'إجراءات سريعة'), icon: Plus, label: t('New Invoice', 'فاتورة جديدة'),        action: () => go('/billing/new'),          keywords: 'create bill payment' },
    { id: 'act-new-lab',      group: t('Quick Actions', 'إجراءات سريعة'), icon: Plus, label: t('New Lab Request', 'طلب مختبر جديد'), action: () => go('/lab/new'),              keywords: 'create test' },
    { id: 'act-new-rx',       group: t('Quick Actions', 'إجراءات سريعة'), icon: Plus, label: t('New Prescription', 'وصفة جديدة'),    action: () => go('/prescriptions/new'),    keywords: 'create rx medication' },
  ]

  // Filter static commands by query
  const filteredCommands = query.trim()
    ? STATIC_COMMANDS.filter((cmd) => {
        const q = query.toLowerCase()
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.sublabel?.toLowerCase().includes(q) ||
          cmd.keywords?.toLowerCase().includes(q) ||
          cmd.group.toLowerCase().includes(q)
        )
      })
    : STATIC_COMMANDS

  // Group them
  const groups = filteredCommands.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})

  // Build flat list for keyboard nav (patients first if any)
  const patientItems = patientResults.map((p) => ({
    id: `patient-${p.id}`,
    label: p.full_name,
    sublabel: `${p.patient_number} · ${p.phone}`,
    icon: Users,
    group: t('Patients', 'المرضى'),
    action: () => go(`/patients/${p.id}`),
  }))

  const flatItems: CommandItem[] = [...patientItems, ...filteredCommands]

  // Search patients
  useEffect(() => {
    if (!query || query.length < 2) { setPatientResults([]); return }
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase.rpc('search_patients', { p_query: query, p_limit: 5 })
      setPatientResults(data || [])
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setPatientResults([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => { setSelectedIndex(0) }, [query])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        flatItems[selectedIndex]?.action()
        onClose()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, flatItems, selectedIndex, onClose])

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  let globalIdx = 0

  const renderPatients = () => {
    if (patientItems.length === 0) return null
    return (
      <div>
        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {t('Patients', 'المرضى')}
        </p>
        {patientItems.map((item) => {
          const idx = globalIdx++
          return (
            <CommandRow
              key={item.id}
              item={item}
              selected={selectedIndex === idx}
              onSelect={() => { item.action(); onClose() }}
              onHover={() => setSelectedIndex(idx)}
            />
          )
        })}
      </div>
    )
  }

  const renderGroups = () =>
    Object.entries(groups).map(([group, items]) => (
      <div key={group}>
        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {group}
        </p>
        {items.map((item) => {
          const idx = globalIdx++
          return (
            <CommandRow
              key={item.id}
              item={item}
              selected={selectedIndex === idx}
              onSelect={() => { item.action(); onClose() }}
              onHover={() => setSelectedIndex(idx)}
            />
          )
        })}
      </div>
    ))

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 md:pt-20 px-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          maxHeight: 'calc(100vh - 120px)',
        }}
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search or jump to…', 'ابحث أو انتقل إلى…')}
            className="flex-1 bg-transparent text-[14px] placeholder:text-[var(--text-muted)] outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} className="hover:text-[var(--text-primary)] transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto flex-1 py-1.5 space-y-0.5">
          {flatItems.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {t('No results', 'لا نتائج')}
            </p>
          ) : (
            <>
              {renderPatients()}
              {renderGroups()}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-3 px-4 py-2 border-t text-[11px] flex-shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

function CommandRow({
  item, selected, onSelect, onHover,
}: {
  item: CommandItem
  selected: boolean
  onSelect: () => void
  onHover: () => void
}) {
  const Icon = item.icon
  return (
    <button
      data-selected={selected}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg mx-1 text-left transition-colors',
        selected ? 'bg-[var(--bg-subtle)]' : 'hover:bg-[var(--bg-subtle)]'
      )}
      style={{ width: 'calc(100% - 8px)' }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: selected ? 'var(--accent-light)' : 'var(--bg-muted)' }}
      >
        <Icon size={14} style={{ color: selected ? 'var(--accent)' : 'var(--text-muted)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {item.label}
        </p>
        {item.sublabel && (
          <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
            {item.sublabel}
          </p>
        )}
      </div>
      {selected && <ArrowRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
    </button>
  )
}
