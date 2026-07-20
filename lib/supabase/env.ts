// Central place that reads + validates Supabase env vars.
// Throws one clear error instead of letting the build crash deep inside
// @supabase/ssr with a confusing stack trace.
//
// IMPORTANT: getSupabaseUrl() / getSupabaseAnonKey() must reference
// process.env.NEXT_PUBLIC_* with a literal dot-access. Next.js only
// inlines NEXT_PUBLIC_ vars into the client bundle when it can
// statically match `process.env.NAME` at build time — a dynamic
// `process.env[name]` lookup (name as a variable) is invisible to
// that static replacement, so in the browser (which has no real
// process.env) it silently reads undefined forever, no matter what
// is set in Vercel or how many times you redeploy.
// SUPABASE_SERVICE_ROLE_KEY is server-only and never bundled to the
// browser, so the dynamic helper is fine for it.

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in Vercel → Project → Settings → Environment Variables (Production, Preview, and Development), then redeploy.`
    )
  }
  return value
}

function requireStaticallyInlined(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in Vercel → Project → Settings → Environment Variables (Production, Preview, and Development), then redeploy.`
    )
  }
  return value
}

export function getSupabaseUrl(): string {
  // Literal dot-access required — see note above. Do not refactor to
  // required('NEXT_PUBLIC_SUPABASE_URL').
  return requireStaticallyInlined('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
}

export function getSupabaseAnonKey(): string {
  // Literal dot-access required — see note above. Do not refactor to
  // required('NEXT_PUBLIC_SUPABASE_ANON_KEY').
  return requireStaticallyInlined('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function getSupabaseServiceRoleKey(): string {
  return required('SUPABASE_SERVICE_ROLE_KEY')
}
