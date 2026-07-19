'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateVisitStatus } from '@/actions/emr.actions'
import type { Visit, VisitStatus } from '@/types/emr'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronLeftIcon, ChevronDownIcon, CalendarIcon, StethoscopeIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

const STATUS_OPTIONS: { value: VisitStatus; label: string }[] = [
  { value: 'open',      label: 'Open' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_COLORS: Record<VisitStatus, string> = {
  open:      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
  cancelled: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400',
}

// ── Visit Header ─────────────────────────────────────────────

export function VisitHeader({ visit }: { visit: Visit }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function changeStatus(status: VisitStatus) {
    startTransition(async () => {
      try {
        await updateVisitStatus(visit.id, status)
        toast.success(`Visit marked as ${status}`)
        router.refresh()
      } catch {
        toast.error('Failed to update status')
      }
    })
  }

  return (
    <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3 px-6 py-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <Link href="/emr">
            <ChevronLeftIcon className="h-4 w-4" />
          </Link>
        </Button>

        <Separator orientation="vertical" className="h-4" />

        {/* Patient */}
        <Avatar className="h-7 w-7">
          <AvatarImage src={visit.patient?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">{initials(visit.patient?.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Link
            href={`/patients/${visit.patient_id}`}
            className="hover:text-primary transition-colors"
          >
            {visit.patient?.full_name ?? 'Unknown Patient'}
          </Link>
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* Date */}
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarIcon className="h-3.5 w-3.5" />
          {format(new Date(visit.visit_date), 'dd MMM yyyy, HH:mm')}
        </span>

        {/* Doctor */}
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StethoscopeIcon className="h-3.5 w-3.5" />
          {visit.doctor?.full_name ?? '—'}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* Status dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                className={cn('h-7 gap-1.5 text-xs border', STATUS_COLORS[visit.status])}
              >
                <span className="capitalize">{visit.status}</span>
                <ChevronDownIcon className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => changeStatus(opt.value)}
                  disabled={opt.value === visit.status}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

// ── Visit Sidebar ────────────────────────────────────────────

export function VisitSidebar({ visit }: { visit: Visit }) {
  const diagnoses = visit.soap_note?.diagnoses ?? []
  const fu = visit.soap_note?.follow_up_date

  return (
    <aside className="w-64 shrink-0 border-l bg-muted/20 overflow-y-auto p-4 space-y-6">
      {/* Patient info */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Patient
        </p>
        <Link
          href={`/patients/${visit.patient_id}`}
          className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-muted transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={visit.patient?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">{initials(visit.patient?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{visit.patient?.full_name}</p>
            {visit.patient?.national_id && (
              <p className="text-xs text-muted-foreground truncate">{visit.patient.national_id}</p>
            )}
          </div>
        </Link>
      </section>

      <Separator />

      {/* Visit meta */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Visit Info
        </p>
        <Row label="Type" value={visit.visit_type.replace('_', ' ')} />
        <Row label="Date" value={format(new Date(visit.visit_date), 'dd MMM yyyy')} />
        <Row label="Doctor" value={visit.doctor?.full_name ?? '—'} />
        {visit.chief_complaint && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Chief Complaint</p>
            <p className="text-xs">{visit.chief_complaint}</p>
          </div>
        )}
      </section>

      {/* Diagnoses */}
      {diagnoses.length > 0 && (
        <>
          <Separator />
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Diagnoses
            </p>
            <div className="space-y-1.5">
              {diagnoses.map((dx, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs shrink-0 mt-0.5">
                    {dx.code}
                  </Badge>
                  <p className="text-xs text-muted-foreground leading-tight">{dx.description}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Follow-up */}
      {fu && (
        <>
          <Separator />
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Follow-up
            </p>
            <p className="text-sm font-medium">
              {format(new Date(fu), 'dd MMM yyyy')}
            </p>
            {visit.soap_note?.follow_up_notes && (
              <p className="text-xs text-muted-foreground mt-1">
                {visit.soap_note.follow_up_notes}
              </p>
            )}
          </section>
        </>
      )}
    </aside>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right capitalize truncate">{value}</span>
    </div>
  )
}
