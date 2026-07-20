'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { VisitFilters } from '@/types/emr'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'

interface VisitFiltersBarProps {
  defaultValues: VisitFilters
}

const ALL = '__all__'

export function VisitFiltersBar({ defaultValues }: VisitFiltersBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const set = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', '1')
      if (!value || value === ALL) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const hasFilters =
    defaultValues.status ||
    defaultValues.date_from ||
    defaultValues.date_to

  function clearAll() {
    router.push(pathname)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status */}
      <Select
        value={defaultValues.status ?? ALL}
        onValueChange={(v) => set('status', v)}
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {/* Date range */}
      <Input
        type="date"
        className="h-8 w-36 text-xs"
        defaultValue={defaultValues.date_from ?? ''}
        placeholder="From"
        onChange={(e) => set('date_from', e.target.value || null)}
      />
      <Input
        type="date"
        className="h-8 w-36 text-xs"
        defaultValue={defaultValues.date_to ?? ''}
        placeholder="To"
        onChange={(e) => set('date_to', e.target.value || null)}
      />

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-muted-foreground"
          onClick={clearAll}
        >
          <XIcon className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  )
}
