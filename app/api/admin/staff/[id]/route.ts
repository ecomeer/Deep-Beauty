import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { isPermission } from '@/lib/admin-permissions'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'staff')
  if (_authErr) return _authErr

  const { id } = await params
  const body = await req.json()
  const updateFields: Record<string, unknown> = {}

  if (body.permissions !== undefined) {
    if (!Array.isArray(body.permissions) || !body.permissions.every(isPermission)) {
      return NextResponse.json({ error: 'صلاحيات غير صحيحة' }, { status: 400 })
    }
    updateFields.permissions = body.permissions
  }
  if (body.is_active !== undefined) updateFields.is_active = !!body.is_active
  if (body.name !== undefined) updateFields.name = String(body.name).trim()

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: 'لا يوجد تعديل' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updateFields)
    .eq('id', id)
    .eq('role', 'staff')
    .select('id, name, email, permissions, is_active, created_at')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })

  return NextResponse.json({ staff: data })
}
