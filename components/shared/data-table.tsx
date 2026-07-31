'use client'

import { type ReactNode, useState, useCallback } from 'react'
import { ChevronUp, ChevronDown, MoreHorizontal, CheckSquare, Square, MinusSquare } from 'lucide-react'
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

export interface BulkAction {
  label: string
  icon?: React.ElementType
  onClick: (ids: string[]) => void
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
  bulkActions?: BulkAction[]
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  emptyMessage?: string
}

export function DataTable<T>({
  columns, data, rowKey, isLoading, onRowClick,
  sortBy, sortDir, onSort, rowActions, bulkActions,
  emptyIcon = Inbox, emptyTitle = 'No results', emptyDescription, emptyMessage,
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const getKey = useCallback(
    (row: T, index: number): string =>
      rowKey ? rowKey(row) : (row as { id?: string | number })?.id?.toString() ?? String(index),
    [rowKey]
  )

  const allIds = data.map((row, i) => getKey(row, i))
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))
  const someSelected = allIds.some((id) => selected.has(id)) && !allSelected

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const hasBulk = !!bulkActions?.length
  const selectedArray = Array.from(selected)

  return (
    <div>
      {/* Bulk action bar */}
      {hasBulk && selected.size > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 mb-2 rounded-xl"
          style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}
        >
          <span className="text-[13px] font-medium" style={{ color: 'var(--accent)' }}>
            {selected.size} selected
          </span>
          <div className="h-4 w-px" style={{ background: 'var(--accent-border)' }} />
          {bulkActions!.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={() => { action.onClick(selectedArray); setSelected(new Set()) }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium transition-colors',
                  action.variant === 'destructive'
                    ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                    : 'bg-white/60 hover:bg-white text-[var(--text-secondary)]'
                )}
              >
                {Icon && <Icon size={12} />}
                {action.label}
              </button>
            )
          })}
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {hasBulk && (
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={toggleAll}
                      className="flex items-center justify-center"
                      style={{ color: someSelected || allSelected ? 'var(--accent)' : 'var(--text-muted)' }}
                    >
                      {allSelected ? <CheckSquare size={16} /> : someSelected ? <MinusSquare size={16} /> : <Square size={16} />}
                    </button>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn('px-5 py-3 text-[11px] font-semibold uppercase tracking-wide select-none', col.sortable && 'cursor-pointer', col.className)}
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
                {data.map((row, index) => {
                  const id = getKey(row, index)
                  const isSelected = selected.has(id)
                  return (
                    <tr
                      key={id}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        'border-b last:border-0 transition-colors',
                        onRowClick && 'cursor-pointer hover:bg-[var(--bg-subtle)]',
                        isSelected && 'bg-[var(--accent-light)]'
                      )}
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {hasBulk && (
                        <td className="px-4 py-3.5" onClick={(e) => { e.stopPropagation(); toggleRow(id) }}>
                          <button
                            className="flex items-center justify-center"
                            style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}
                          >
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                      )}
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
                                  className={action.variant === 'destructive' ? 'text-red-500' : undefined}
                                >
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            )}
          </table>
        </div>
        {isLoading && <TableSkeleton cols={columns.length + (hasBulk ? 1 : 0)} />}
        {!isLoading && data.length === 0 && (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription ?? emptyMessage} />
        )}
      </div>
    </div>
  )
}
