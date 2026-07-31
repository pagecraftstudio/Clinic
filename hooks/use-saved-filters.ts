'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Persist filter state to localStorage per page key.
 * Falls back to `defaultValue` if nothing saved.
 *
 * @example
 * const [filters, setFilters] = useSavedFilters('patients', { search: '', page: 1 })
 */
export function useSavedFilters<T extends object>(
  key: string,
  defaultValue: T
): [T, (updater: T | ((prev: T) => T)) => void, () => void] {
  const storageKey = `clinic-filters-${key}`

  const [filters, setFiltersState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return defaultValue
      return { ...defaultValue, ...JSON.parse(raw), page: 1 }
    } catch {
      return defaultValue
    }
  })

  const setFilters = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setFiltersState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        try {
          const { page: _page, ...toSave } = next as T & { page?: number }
          localStorage.setItem(storageKey, JSON.stringify(toSave))
        } catch {}
        return next
      })
    },
    [storageKey]
  )

  const clearFilters = useCallback(() => {
    try { localStorage.removeItem(storageKey) } catch {}
    setFiltersState(defaultValue)
  }, [storageKey, defaultValue])

  return [filters, setFilters, clearFilters]
}
