'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import type { Visit, VisitStatus, VisitType } from '@/types/emr'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface VisitsTableProps {
  visits: Visit[]
  count: number
  page: number
  perPage: number
}

const STATUS_STYLES: Record<VisitStatus, string> = {
  open:      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
  cancelled: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400',
}

const TYPE_LABELS: Record<VisitType, string> = {
  outpatient:  'Outpatient',
  follow_up:   'Follow-up',
  emergency:   'Emergency',
  teleconsult: 'Teleconsult',
}

const TYPE_STYLES: Record<VisitType, string> = {
  outpatient:  'text-muted-foreground',
  follow_up:   'text-purple-600 dark:text-purple-400',
  emergency:   'text-red-600 dark:text-red-400',
  teleconsult: 'text-sky-600 dark:text-sky-400',
}

function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export function VisitsTable({ visits, count, page, perPage }: VisitsTableProps) {
  const totalPages = Math.ceil(count / perPage)

  if (visits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">No visits match your filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[220px]">Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Chief Complaint</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.map((visit) => (
              <TableRow key={visit.id} className="cursor-pointer group" asChild>
                <Link href={`/emr/${visit.id}`} className="contents">
                  {/* Patient */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={visit.patient?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {initials(visit.patient?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {visit.patient?.full_name ?? '—'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Doctor */}
                  <TableCell className="text-sm text-muted-foreground">
                    {visit.doctor?.full_name ?? '—'}
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <span className={cn('text-xs font-medium', TYPE_STYLES[visit.visit_type])}>
                      {TYPE_LABELS[visit.visit_type]}
                    </span>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                    {format(new Date(visit.visit_date), 'dd MMM yyyy, HH:mm')}
                  </TableCell>

                  {/* Chief complaint */}
                  <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">
                    {visit.chief_complaint ?? '—'}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('text-xs capitalize', STATUS_STYLES[visit.status])}
                    >
                      {visit.status}
                    </Badge>
                  </TableCell>
                </Link>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`?page=${page - 1}`}
                aria-disabled={page <= 1}
                className={cn(page <= 1 && 'pointer-events-none opacity-40')}
              />
            </PaginationItem>
            <PaginationItem className="text-xs text-muted-foreground px-3 flex items-center">
              Page {page} of {totalPages}
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href={`?page=${page + 1}`}
                aria-disabled={page >= totalPages}
                className={cn(page >= totalPages && 'pointer-events-none opacity-40')}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
