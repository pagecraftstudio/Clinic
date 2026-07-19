// WORKAROUND for a known Next.js 15.0.x bug: `next/server` bundles
// ua-parser-js internally (for its userAgent() helper), and ua-parser-js
// references `__dirname`, which doesn't exist on Vercel's Edge runtime.
// That's what was actually causing every request to this middleware to
// 500 with "ReferenceError: __dirname is not defined" — nothing to do
// with Supabase. Defining it as a no-op global before next/server is
// imported avoids the crash. See: github.com/vercel/next.js/issues/53968
// Longer-term fix: upgrade Next.js past 15.0.7, where this is resolved.
if (typeof globalThis.__dirname === 'undefined') {
  ;(globalThis as any).__dirname = '/'
}

import { NextResponse, type NextRequest } from 'next/server'

// No public self-signup: staff accounts are created by an admin via
// /settings/users. Only login and password-reset are public.
// TEMP: '/debug-env' added for diagnosing an env var issue — remove
// this entry once resolved, along with app/debug-env/page.tsx.
const PUBLIC_ROUTES = ['/login', '/reset-password', '/debug-env']

// IMPORTANT: this file runs on Vercel's Edge Runtime, which does not
// support Node.js APIs. @supabase/supabase-js (pulled in via
// @supabase/ssr's createServerClient) touches `process.version`
// internally, which throws on Edge as soon as the module loads —
// before any of our code runs, so no try/catch can catch it. That
// was the actual cause of the recurring
// "500: MIDDLEWARE_INVOCATION_FAILED" error. Do NOT import
// @supabase/ssr or @supabase/supabase-js in this file.
//
// Instead: do a cheap, Edge-safe check for the presence of a Supabase
// auth cookie to redirect obviously-logged-out users early. The real,
// authoritative session check (which validates the token, not just
// its presence) already happens in app/(dashboard)/layout.tsx, which
// runs on the Node.js runtime where supabase-js works normally.

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
}

export function middleware(request: NextRequest) {
  const isPublicRoute = PUBLIC_ROUTES.some((r) =>
    request.nextUrl.pathname.startsWith(r)
  )
  const hasSession = hasSupabaseSessionCookie(request)

  // No session cookie at all, and hitting a protected route → bounce to
  // login early. (If the cookie exists but the token is invalid/expired,
  // app/(dashboard)/layout.tsx catches that and redirects too.)
  if (!hasSession && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Has a session cookie and is on a public auth page → send to dashboard.
  // (Best-effort UX nicety; if the cookie turns out to be stale, the
  // dashboard layout will bounce back to /login anyway.)
  if (hasSession && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
