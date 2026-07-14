import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hasAdminMetadata, isDevBypass, isEmailAllowListed } from '@/lib/admin-config'
import type { Permission } from '@/lib/admin-permissions'
import { resolveAdminAccess } from '@/lib/admin-access'

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
    const roleFromProfiles = profilesRoleRes.data?.role
    const access = resolveAdminAccess({
      role: roleFromUsers ?? roleFromProfiles,
      isActive: usersRoleRes.data?.is_active !== false,
      permissions: usersRoleRes.data?.permissions,
      hasAdminMetadata: hasAdminMetadata(user),
      isEmailAllowListed: isEmailAllowListed(user.email),
    }, permission)

    if (access !== 'admin' && access !== 'staff') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    return null
  } catch (err) {
    console.error('requireAdmin error:', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: { getAll() { return req.cookies.getAll() }, setAll() {} },
  })
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
