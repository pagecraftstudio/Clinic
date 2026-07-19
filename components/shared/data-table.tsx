'use client'

import { type ReactNode } from 'react'
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableSkeleton } from './loading-skeleton'
import { EmptyState } from './empty-state'
import { type LucideIcon, Inbox } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortable?: boolean
  className?: string
}

export interface RowAction<T> {
  label: string
  onClick: (row: T) => void
  variant?: 'default' | 'destructive'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey?: (row: T) => string
  isLoading?: boolean
  onRowClick?: (row: T) => void
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  rowActions?: (row: T) => RowAction<T>[]
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  emptyMessage?: string
}

export function DataTable<T>({
  columns, data, rowKey, isLoading, onRowClick,
  sortBy, sortDir, onSort, rowActions,
  emptyIcon = Inbox, emptyTitle = 'No results', emptyDescription, emptyMessage,
}: DataTableProps<T>) {
  const getRowKey = (row: T, index: number): string =>
    rowKey ? rowKey(row) : (row as { id?: string | number })?.id?.toString() ?? String(index)
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
              {rowActions && <th className="px-5 py-3 w-10" />}
            </tr>
          </thead>
          {!isLoading && (
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  onClick={() => onRowClick?.(row)}
                  className={cn('border-b last:border-0 transition-colors', onRowClick && 'cursor-pointer hover:bg-[var(--bg-subtle)]')}
                  style={{ borderColor: 'var(--border)' }}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-5 py-3.5 text-[13px]', col.className)} style={{ color: 'var(--text-secondary)' }}>
                      {col.render(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-[var(--bg-subtle)]"
                            aria-label="Row actions"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {rowActions(row).map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={() => action.onClick(row)}
                              className={action.variant === 'destructive' ? 'text-[var(--error)]' : undefined}
                            >
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      {isLoading && <TableSkeleton cols={columns.length} />}
      {!isLoading && data.length === 0 && (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription ?? emptyMessage} />
      )}
    </div>
  )
}
