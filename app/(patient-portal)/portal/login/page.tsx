'use client'

export const dynamic = 'force-dynamic'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Activity, Loader2, ArrowLeft } from 'lucide-react'
import { useLang } from '@/lib/i18n/context'

export default function PatientLoginPage() {
  const { tr, isRtl } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(tr.invalidCredentials); return }
      window.location.href = '/portal'
    })
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-surface)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
    transition: 'border-color 0.15s', boxSizing: 'border-box' as const,
    direction: 'ltr' as const,
  }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5, color: 'var(--text-secondary)' }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <Link href="/portal" className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-[var(--accent)]"
          style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={13} style={{ transform: isRtl ? 'rotate(180deg)' : undefined }} />
          {tr.home}
        </Link>

        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
          <div className="flex flex-col items-center mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--accent)' }}>
              <Activity size={18} color="white" />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{tr.signIn}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>{tr.loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>{tr.emailLabel}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <div>
              <label style={labelStyle}>{tr.passwordLabel}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: 'var(--danger)', padding: '8px 12px', background: 'var(--danger-light)', borderRadius: 8 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={isPending} style={{
              width: '100%', padding: '10px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 500,
              cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.15s',
            }}>
              {isPending ? <><Loader2 size={14} className="animate-spin" /> {tr.signingIn}</> : tr.signIn}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
          {tr.noAccount}{' '}
          <Link href="/portal/register" style={{ color: 'var(--accent)' }}>{tr.createOne}</Link>
        </p>
      </div>
    </div>
  )
}
