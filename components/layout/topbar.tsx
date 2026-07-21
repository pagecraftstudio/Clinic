'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, Sun, Moon, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

interface TopbarProps {
  title?: string
}

export function Topbar({ title }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)

  // Global keyboard shortcut — Cmd/Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') { setSearchOpen(false); setQuery('') }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Search patients
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase.rpc('search_patients', { p_query: query, p_limit: 6 })
      setResults(data || [])
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const supabase = createClient()

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null)
      return count ?? 0
    },
    refetchInterval: 30_000,
  })

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      return data
    },
  })

  return (
    <>
      {/* Topbar */}
      <header
        className="fixed top-0 right-0 z-30 flex items-center justify-between h-16 px-6 border-b"
        style={{
          left: '240px',
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Left: page title */}
        <div>
          {title && (
            <h1 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Search trigger */}
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-colors"
            style={{
              background: 'var(--bg-subtle)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            <Search size={14} />
            <span>Search patients…</span>
            <kbd
              className="text-[11px] px-1.5 py-0.5 rounded"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-subtle)]"
              style={{ color: 'var(--text-muted)' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}

          {/* Notifications */}
          <button
            onClick={() => router.push('/notifications')}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <Bell size={16} />
            {!!unreadCount && unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* Avatar */}
          <button
            onClick={() => router.push('/settings')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            {profile?.first_name?.[0]?.toUpperCase() ?? 'U'}
          </button>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setSearchOpen(false); setQuery('') } }}
        >
          <div
            className="w-full max-w-xl rounded-xl shadow-lg overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patients by name, phone, or ID…"
                className="flex-1 bg-transparent text-[14px] placeholder:text-[var(--text-muted)] outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              <button
                onClick={() => { setSearchOpen(false); setQuery('') }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {results.length > 0 ? (
                results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { router.push(`/patients/${p.id}`); setSearchOpen(false); setQuery('') }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-subtle)]"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
                      style={{ background: 'var(--accent)' }}
                    >
                      {p.full_name?.[0]?.toUpperCase() ?? 'P'}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.full_name}
                      </p>
                      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        {p.patient_number} · {p.phone}
                      </p>
                    </div>
                  </button>
                ))
              ) : query.length >= 2 ? (
                <p className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  No patients found for &ldquo;{query}&rdquo;
                </p>
              ) : (
                <p className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  Start typing to search patients
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
