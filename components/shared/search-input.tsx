'use client'

import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
}

export function SearchInput({ value, onChange, placeholder = 'Search…', debounceMs = 300 }: SearchInputProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => setLocal(value), [value])

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local)
    }, debounceMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local])

  return (
    <div
      className="flex items-center gap-2 px-3 h-9 rounded-lg w-full max-w-xs"
      style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
    >
      <Search size={14} style={{ color: 'var(--text-muted)' }} />
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none flex-1 text-[13px]"
        style={{ color: 'var(--text-primary)' }}
      />
      {local && (
        <button onClick={() => { setLocal(''); onChange('') }} aria-label="Clear search">
          <X size={13} style={{ color: 'var(--text-muted)' }} />
        </button>
      )}
    </div>
  )
}
