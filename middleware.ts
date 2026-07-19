import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// No public self-signup: staff accounts are created by an admin via
// /settings/users. Only login and password-reset are public.
const PUBLIC_ROUTES = ['/login', '/reset-password']

async function checkAuth(request: NextRequest): Promise<{
  response: NextResponse
  user: unknown | null
}> {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'middleware: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
    return { response: supabaseResponse, user: null }
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data } = await supabase.auth.getUser()
  return { response: supabaseResponse, user: data.user }
}

export async function middleware(request: NextRequest) {
  const isPublicRoute = PUBLIC_ROUTES.some((r) =>
    request.nextUrl.pathname.startsWith(r)
  )

  // Whole auth check is wrapped: ANY unexpected throw here (bad creds,
  // network error, library bug, wrong env value) fails OPEN — request
  // passes through — instead of 500ing the entire site again like
  // MIDDLEWARE_INVOCATION_FAILED did. We only ever actively block
  // access (redirect to /login) on a clean, successful "no user" result.
  let response: NextResponse
  let user: unknown | null = null
  try {
    const result = await checkAuth(request)
    response = result.response
    user = result.user
  } catch (err) {
    console.error('middleware: auth check threw, failing open:', err)
    return NextResponse.next({ request })
  }

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (user && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
