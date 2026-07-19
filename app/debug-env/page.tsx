// TEMPORARY DIAGNOSTIC PAGE — delete this file once the env var issue
// is resolved. Do not leave this deployed long-term: even though it
// doesn't print secret values, it does confirm which env vars exist,
// which is more than a public page should reveal.

export const dynamic = 'force-dynamic'

function status(name: string) {
  const value = process.env[name]
  if (value === undefined) return '❌ MISSING'
  if (value.trim() === '') return '⚠️ EMPTY STRING'
  if (/^\s|\s$/.test(value)) return `⚠️ HAS WHITESPACE (len ${value.length})`
  return `✅ present (len ${value.length}, starts "${value.slice(0, 8)}...")`
}

export default function DebugEnvPage() {
  const vars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 14 }}>
      <h1>Env Var Diagnostic (server-side, this request)</h1>
      <ul>
        {vars.map((name) => (
          <li key={name}>
            <strong>{name}</strong>: {status(name)}
          </li>
        ))}
      </ul>
      <p>VERCEL_ENV: {process.env.VERCEL_ENV ?? '(not set)'}</p>
      <p>NODE_ENV: {process.env.NODE_ENV ?? '(not set)'}</p>
      <p>Build time: this text was rendered at {new Date().toISOString()}</p>
    </div>
  )
}
