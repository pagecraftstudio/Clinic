'use client'

import { useEffect, useCallback } from 'react'

type Modifier = 'ctrl' | 'meta' | 'shift' | 'alt'

interface ShortcutOptions {
  key: string
  modifiers?: Modifier[]
  onKeyDown: (e: KeyboardEvent) => void
  disabled?: boolean
  /** Skip when focus is in an input/textarea/select */
  ignoreInputs?: boolean
}

export function useKeyboardShortcut({
  key,
  modifiers = [],
  onKeyDown,
  disabled = false,
  ignoreInputs = true,
}: ShortcutOptions) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return
      if (ignoreInputs) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if ((e.target as HTMLElement)?.isContentEditable) return
      }
      if (e.key.toLowerCase() !== key.toLowerCase()) return
      if (modifiers.includes('ctrl') && !e.ctrlKey) return
      if (modifiers.includes('meta') && !e.metaKey) return
      if (modifiers.includes('shift') && !e.shiftKey) return
      if (modifiers.includes('alt') && !e.altKey) return
      onKeyDown(e)
    },
    [disabled, ignoreInputs, key, modifiers, onKeyDown]
  )

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}
