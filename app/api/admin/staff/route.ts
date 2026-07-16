import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { isPermission } from '@/lib/admin-permissions'

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req, 'staff')
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, permissions, is_active, created_at')
    .eq('role', 'staff')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data ?? [] })
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req, 'staff')
  if (authError) return authError

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
  const normalizedName = name.trim()

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { name: normalizedName },
  })

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message || 'فشل إنشاء الحساب' }, { status: 400 })
  }

  // The auth.users trigger has already created public.users with role=customer.
  // Promote that trusted row instead of inserting a duplicate primary key.
  const { data: userRow, error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      name: normalizedName,
      email: normalizedEmail,
      role: 'staff',
      permissions: validPermissions,
      is_active: true,
    })
    .eq('id', created.user.id)
    .select('id, name, email, permissions, is_active, created_at')
    .maybeSingle()

  if (updateError || !userRow) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json(
      { error: updateError?.message || 'فشل إنشاء ملف الموظف' },
      { status: 500 }
    )
  }

  return NextResponse.json({ staff: userRow }, { status: 201 })
}
