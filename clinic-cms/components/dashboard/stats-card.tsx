'use client'
import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  change?: { value: number; label: string }
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: 'up' | 'down' | 'neutral'
  suffix?: string
  index?: number
}

export function StatsCard({
  title, value, change, icon: Icon,
  iconColor = '#2563EB', iconBg = '#EFF6FF',
  trend = 'neutral', suffix, index = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {title}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={15} style={{ color: iconColor }} />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5">
        <span
          className="text-[26px] font-bold leading-none tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {suffix && (
          <span className="text-[13px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
            {suffix}
          </span>
        )}
      </div>

      {/* Change indicator */}
      {change && (
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'text-[11px] font-semibold',
              trend === 'up'   && 'text-emerald-600',
              trend === 'down' && 'text-red-500',
              trend === 'neutral' && 'text-[var(--text-muted)]',
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''}
            {change.value > 0 ? '+' : ''}{change.value}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {change.label}
          </span>
        </div>
      )}
    </motion.div>
  )
}
