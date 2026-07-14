import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hasAdminMetadata, isDevBypass, isEmailAllowListed } from '@/lib/admin-config'
import type { Permission } from '@/lib/admin-permissions'

/**
 * Verifies the request comes from an authenticated admin via session cookie.
 * Returns null if authorized, or a NextResponse error otherwise.
 *
 * `permission`, when passed, is the scoped capability a 'staff' user needs
 * (full admins bypass this check). Passing `'staff'` restricts the route to
 * full admins only — even a staff user with every other permission can't
 * manage other staff accounts.
 * Usage: const err = await requireAdmin(req, 'orders'); if (err) return err
 */
export async function requireAdmin(
  req: NextRequest,
  permission?: Permission | 'staff'
): Promise<NextResponse | null> {
  if (isDevBypass()) return null

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

    // Support DB role (users/profiles), auth metadata role, and the email
    // allowlist — the same sources the proxy page-guard accepts — to avoid
    // false 403s when only one source is configured.
    const [usersRoleRes, profilesRoleRes] = await Promise.all([
      supabaseAdmin.from('users').select('role, is_active, permissions').eq('id', user.id).maybeSingle(),
      supabaseAdmin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    ])
    const roleFromUsers = usersRoleRes.data?.role
    const isActiveUser = usersRoleRes.data?.is_active !== false
    const roleFromProfiles = profilesRoleRes.data?.role
    const isFullAdmin =
      [roleFromUsers, roleFromProfiles].includes('admin') ||
      hasAdminMetadata(user) ||
      isEmailAllowListed(user.email)

    if (!isActiveUser) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }
    if (isFullAdmin) return null

    // Staff management is never delegable to staff themselves.
    if (permission === 'staff') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    const isStaff = roleFromUsers === 'staff'
    const staffPermissions = usersRoleRes.data?.permissions ?? []
    const isAuthorizedStaff = isStaff && (!permission || staffPermissions.includes(permission))

    if (!isAuthorizedStaff) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    return null
  } catch (err) {
    console.error('requireAdmin error:', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
