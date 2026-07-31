import { toast } from 'sonner'

interface UndoOptions {
  message: string
  onUndo: () => void | Promise<void>
  duration?: number
}

/**
 * Show a toast with an Undo action.
 * Usage:
 *   const { execute } = undoToast({
 *     message: 'Patient archived',
 *     onUndo: () => restorePatient(id),
 *   })
 *   execute()  // run the deferred action after toast expires
 */
export function undoToast({ message, onUndo, duration = 5000 }: UndoOptions) {
  let undone = false

  const id = toast(message, {
    duration,
    action: {
      label: 'Undo',
      onClick: () => {
        undone = true
        onUndo()
      },
    },
  })

  return {
    id,
    wasUndone: () => undone,
  }
}
