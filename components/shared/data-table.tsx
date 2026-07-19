'use client'

import { type ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableSkeleton } from './loading-skeleton'
import { EmptyState } from './empty-state'
import { type LucideIcon, Inbox } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  isLoading?: boolean
  onRowClick?: (row: T) => void
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
}

export function DataTable<T>({
  columns, data, rowKey, isLoading, onRowClick,
  sortBy, sortDir, onSort,
  emptyIcon = Inbox, emptyTitle = 'No results', emptyDescription,
}: DataTableProps<T>) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-5 py-3 text-[11px] font-semibold uppercase tracking-wide select-none',
                    col.sortable && 'cursor-pointer',
                    col.className
                  )}
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortBy === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          {!isLoading && (
            <tbody>
              {data.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn('border-b last:border-0 transition-colors', onRowClick && 'cursor-pointer hover:bg-[var(--bg-subtle)]')}
                  style={{ borderColor: 'var(--border)' }}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-5 py-3.5 text-[13px]', col.className)} style={{ color: 'var(--text-secondary)' }}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      {isLoading && <TableSkeleton cols={columns.length} />}
      {!isLoading && data.length === 0 && (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  )
}
