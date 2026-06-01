import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Verifies the request comes from an authenticated admin via session cookie.
 * Returns null if admin, or a NextResponse error otherwise.
 * Usage: const err = await requireAdmin(req); if (err) return err
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll() { /* read-only in API routes */ },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Role is embedded in app_metadata (JWT) — no DB round-trip needed
    const isAdmin = user.app_metadata?.role === 'admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    return null
  } catch (err) {
    console.error('requireAdmin error:', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
