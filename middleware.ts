import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: { headers: req.headers } })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        response = NextResponse.next({ request: { headers: req.headers } })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = req.nextUrl.pathname
  const isAdminApiRoute = pathname.startsWith('/api/admin')
  const isAdminUiRoute = pathname.startsWith('/admin')
  const isLoginPage = pathname === '/admin/login'

  // Shared role check — called lazily so DB is only queried once per request
  let adminStatus: boolean | null = null
  const checkAdmin = async (): Promise<boolean> => {
    if (adminStatus !== null) return adminStatus
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user!.id)
      .single()
    adminStatus = data?.role === 'admin'
    return adminStatus
  }

  // ── API routes: JSON errors, no redirects ────────────────────────────────
  if (isAdminApiRoute) {
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: authentication required' },
        { status: 401 }
      )
    }
    if (!(await checkAdmin())) {
      return NextResponse.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      )
    }
    return response
  }

  // ── UI routes: redirect-based flow ──────────────────────────────────────
  if (isAdminUiRoute && !isLoginPage) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    if (!(await checkAdmin())) {
      // Authenticated but not admin → redirect to store home
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  if (isLoginPage && user) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }

  if (pathname === '/admin') {
    return NextResponse.redirect(
      new URL(user ? '/admin/dashboard' : '/admin/login', req.url)
    )
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
