import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Verifies the request comes from an authenticated admin via session cookie.
 * Returns null if admin, or a NextResponse error otherwise.
 * Usage: const err = await requireAdmin(req); if (err) return err
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  // DEV PREVIEW BYPASS — only when explicitly set in .env.local
  if (process.env.NEXT_PUBLIC_DEV_BYPASS === 'true') return null

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

    // FIXED: Support both DB role (users/profiles) and auth metadata role to avoid false 403s.
    const [usersRoleRes, profilesRoleRes] = await Promise.all([
      supabaseAdmin.from('users').select('role, is_active').eq('id', user.id).maybeSingle(),
      supabaseAdmin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    ])
    const roleFromUsers = usersRoleRes.data?.role
    const isActiveUser = usersRoleRes.data?.is_active !== false
    const roleFromProfiles = profilesRoleRes.data?.role
    const roleFromMetadata = user.app_metadata?.role ?? user.user_metadata?.role
    const isAdmin = isActiveUser && [roleFromUsers, roleFromProfiles, roleFromMetadata].includes('admin')

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    return null
  } catch (err) {
    console.error('requireAdmin error:', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
