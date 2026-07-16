import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasAdminMetadata, isDevBypass, isEmailAllowListed } from '@/lib/admin-config'
import { resolveAdminAccess } from '@/lib/admin-access'
import type { Permission } from '@/lib/admin-permissions'

function permissionForAdminPath(pathname: string): Permission | 'staff' | undefined {
  if (pathname === '/admin/team' || pathname.startsWith('/admin/team/')) return 'staff'
  if (pathname === '/admin/orders' || pathname.startsWith('/admin/orders/')) return 'orders'
  if (pathname === '/admin/products' || pathname.startsWith('/admin/products/') || pathname.startsWith('/admin/categories') || pathname.startsWith('/admin/banners')) return 'products'
  if (pathname.startsWith('/admin/customers') || pathname.startsWith('/admin/newsletter')) return 'customers'
  if (pathname.startsWith('/admin/reviews')) return 'reviews'
  if (pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/shipping')) return 'settings'
  if (pathname.startsWith('/admin/marketing') || pathname.startsWith('/admin/flash-sales') || pathname.startsWith('/admin/abandoned-carts')) return 'marketing'
  return undefined
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const pathname = request.nextUrl.pathname
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

  let access: ReturnType<typeof resolveAdminAccess> = 'unauthenticated'
  if (user) {
    const { data: userRow } = await supabase
      .from('users')
      .select('role, is_active, permissions')
      .eq('id', user.id)
      .maybeSingle()
    access = resolveAdminAccess({
      role: userRow?.role,
      isActive: userRow?.is_active !== false,
      permissions: userRow?.permissions,
      hasAdminMetadata: hasAdminMetadata(user),
      isEmailAllowListed: isEmailAllowListed(user.email),
    }, permissionForAdminPath(pathname))
  }

  // ── DEV PREVIEW BYPASS — local machine only, NOT Vercel ─────────
  if (isDevBypass() && isAdminRoute) {
    return NextResponse.next({ request })
  }
  // ────────────────────────────────────────────────────────────────

  if (isAdminRoute && !isLoginPage) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (access === 'unauthenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (access === 'forbidden') {
      return NextResponse.redirect(new URL('/admin/403', request.url))
    }
  }

  if (isLoginPage && user && access !== 'forbidden' && access !== 'unauthenticated') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
