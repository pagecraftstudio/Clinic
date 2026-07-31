'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { useLang } from '@/lib/lang-context'
import { CommandPalette } from './command-palette'

interface TopbarProps {
  title?: string
  onMenuClick?: () => void
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLang()
  const [mounted, setMounted] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  // Global Cmd/Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
      <header
        className="fixed top-0 left-0 right-0 md:left-[240px] z-30 flex items-center justify-between h-16 px-4 md:px-6 border-b"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <Menu size={18} />
          </button>
          {title && (
            <h1 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Command palette trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-[13px] transition-colors"
            style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            <Search size={14} />
            <span className="hidden sm:inline">{t('Search or jump to…', 'ابحث أو انتقل…')}</span>
            <kbd
              className="hidden sm:inline text-[11px] px-1.5 py-0.5 rounded"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Language */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="h-8 px-2.5 rounded-lg flex items-center justify-center text-[12px] font-semibold transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', minWidth: '2.5rem' }}
          >
            {lang === 'en' ? 'ع' : 'EN'}
          </button>

          {/* Theme */}
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

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}
