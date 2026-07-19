// Central place that reads + validates Supabase env vars.
// Throws one clear error instead of letting the build crash deep inside
// @supabase/ssr with a confusing stack trace.

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

export function getSupabaseUrl(): string {
  return required('NEXT_PUBLIC_SUPABASE_URL')
}

export function getSupabaseAnonKey(): string {
  return required('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function getSupabaseServiceRoleKey(): string {
  return required('SUPABASE_SERVICE_ROLE_KEY')
}
