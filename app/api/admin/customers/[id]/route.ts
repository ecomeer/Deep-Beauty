import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { normalizeAdminCustomerUpdate } from '@/lib/profile-updates'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req, 'customers')
  if (authError) return authError
  const { id } = await params

  const { data: customer, error: customerError } = await supabaseAdmin
    .from('users')
    .select('id,email,name,phone,role,is_active,loyalty_points,created_at')
    .eq('id', id)
    .eq('role', 'customer')
    .maybeSingle()

  if (customerError) return NextResponse.json({ error: customerError.message }, { status: 500 })
  if (!customer) return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 })

  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id,order_number,total,status,created_at')
    .eq('customer_email', customer.email)
    .order('created_at', { ascending: false })
    .limit(10)

  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 })

  return NextResponse.json({ customer, orders: orders || [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req, 'customers')
  if (authError) return authError

  try {
    const { id } = await params
    const { data: target, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id,role')
      .eq('id', id)
      .maybeSingle()

    if (targetError) return NextResponse.json({ error: targetError.message }, { status: 500 })
    if (!target) return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 })
    if (target.role !== 'customer') {
      return NextResponse.json({ error: 'لا يمكن تعديل حساب إداري من مسار العملاء' }, { status: 403 })
    }

    let updates
    try {
      updates = normalizeAdminCustomerUpdate(await req.json())
    } catch {
      return NextResponse.json({ error: 'لا توجد بيانات عميل صالحة للتحديث' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .eq('role', 'customer')
      .select('id,email,name,phone,role,is_active,loyalty_points,created_at')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'تعذر تحديث العميل' }, { status: 409 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Deleting an Auth identity is a full-admin operation. Staff with the
  // customers permission can deactivate a customer through PATCH instead.
  const authError = await requireAdmin(req, 'staff')
  if (authError) return authError

  try {
    const { id } = await params
    const { data: target, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id,role')
      .eq('id', id)
      .maybeSingle()

    if (targetError) return NextResponse.json({ error: targetError.message }, { status: 500 })
    if (!target) return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 })
    if (target.role !== 'customer') {
      return NextResponse.json({ error: 'لا يمكن حذف حساب إداري من مسار العملاء' }, { status: 403 })
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
