import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { isPermission } from '@/lib/admin-permissions'

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'staff')
  if (_authErr) return _authErr

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, permissions, is_active, created_at')
    .eq('role', 'staff')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data ?? [] })
}

export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'staff')
  if (_authErr) return _authErr

  const body = await req.json()
  const { name, email, password, permissions } = body as {
    name?: string
    email?: string
    password?: string
    permissions?: string[]
  }

  if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
    return NextResponse.json(
      { error: 'الاسم والبريد وكلمة مرور (8 أحرف على الأقل) مطلوبة' },
      { status: 400 }
    )
  }

  const validPermissions = Array.isArray(permissions) ? permissions.filter(isPermission) : []
  const normalizedEmail = email.trim().toLowerCase()

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
  })

  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message || 'فشل إنشاء الحساب' }, { status: 400 })
  }

  const { data: userRow, error: insertErr } = await supabaseAdmin
    .from('users')
    .insert({
      id: created.user.id,
      name: name.trim(),
      email: normalizedEmail,
      role: 'staff',
      permissions: validPermissions,
      is_active: true,
    })
    .select('id, name, email, permissions, is_active, created_at')
    .single()

  if (insertErr) {
    // Roll back the orphaned auth user so a failed insert doesn't leave an
    // unusable account with no matching profile row.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ staff: userRow }, { status: 201 })
}
