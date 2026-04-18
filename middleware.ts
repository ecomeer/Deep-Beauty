import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  // Helper: check if user has admin role
  const checkAdminRole = async (userId: string): Promise<boolean> => {
    try {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      // Check users table first
      const { data: profile } = await adminClient
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()
      if (profile?.role === 'admin') return true

      // Fallback: check auth.users app_metadata (set via Supabase dashboard)
      const { data: authUser } = await adminClient.auth.admin.getUserById(userId)
      return authUser?.user?.app_metadata?.role === 'admin'
    } catch {
      return false
    }
  }

  if (isAdminRoute && !isLoginPage) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    const isAdmin = await checkAdminRole(user.id)
    if (!isAdmin) {
      // Not admin — send to login but clear session to prevent redirect loop
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }
  }

  if (isLoginPage && user) {
    const isAdmin = await checkAdminRole(user.id)
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    // User logged in but not admin — stay on login page (no redirect)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
