'use client'

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onCancel?: () => void
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
  loading?: boolean
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open, onOpenChange, onCancel, title, description,
  confirmLabel = 'Confirm', destructive = false, loading, isLoading, onConfirm,
}: ConfirmDialogProps) {
  const busy = loading ?? isLoading ?? false
  const handleOpenChange = (val: boolean) => {
    if (!val && onCancel) onCancel()
    if (onOpenChange) onOpenChange(val)
  }
  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); onConfirm() }}
            disabled={busy}
            className={destructive ? 'bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white' : ''}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
