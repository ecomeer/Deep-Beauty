import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { hasAdminMetadata, isDevBypass, isEmailAllowListed } from '@/lib/admin-config'

// Tells the admin UI whether the current session is a full admin or a
// scoped 'staff' account (and which permissions it has), so the sidebar can
// hide nav items the user isn't authorized for. Mirrors the same role
// resolution as requireAdmin() in lib/auth-admin.ts.
export async function GET(req: NextRequest) {
  if (isDevBypass()) {
    return NextResponse.json({ role: 'admin', permissions: [] })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return req.cookies.getAll() },
      setAll() { /* read-only */ },
    },
  })

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('role, permissions')
    .eq('id', user.id)
    .maybeSingle()

  const isFullAdmin =
    userRow?.role === 'admin' || hasAdminMetadata(user) || isEmailAllowListed(user.email)

  if (isFullAdmin) return NextResponse.json({ role: 'admin', permissions: [] })
  if (userRow?.role === 'staff') {
    return NextResponse.json({ role: 'staff', permissions: userRow.permissions ?? [] })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
