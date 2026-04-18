import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Verifies the request comes from an authenticated admin via session cookie.
 * Returns null if admin, or a NextResponse error otherwise.
 * Usage: const err = await requireAdmin(req); if (err) return err
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    return null
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
