import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginPage = pathname === '/admin/login'

  // FIXED: loop protection for accidental admin login redirect bounce.
  const referer = request.headers.get('referer')
  const isRedirectLoop = referer && referer.includes('/admin/login') && pathname === '/admin/login'

  if (isRedirectLoop) {
    const response = NextResponse.next({ request })
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    return response
  }

  const isAdmin = user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin'

  if (process.env.NODE_ENV === 'development') {
    console.log('Proxy:', { pathname, isAdminRoute, isLoginPage, hasUser: !!user, isAdmin })
  }

  // ── DEV PREVIEW BYPASS — local machine only, NOT Vercel ─────────
  // NEXT_PUBLIC_DEV_BYPASS=true must be set manually in .env.local
  // This variable is intentionally NOT in .env.example so it never ships.
  if (process.env.NEXT_PUBLIC_DEV_BYPASS === 'true' && isAdminRoute) {
    return NextResponse.next({ request })
  }
  // ────────────────────────────────────────────────────────────────

  if (isAdminRoute && !isLoginPage) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  if (isLoginPage && user && isAdmin) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
