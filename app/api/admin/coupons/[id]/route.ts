import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { logActivity } from '@/lib/activity-log'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('id, code, description_ar, type, value, min_order_amount, max_discount_amount, usage_limit, usage_count, expires_at, is_active, created_at')
    .eq('id', id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr
  try {
    const body = await req.json()
    const { id } = await params

    // Whitelist updatable columns — never forward arbitrary client keys
    // (mass-assignment); mirrors the create route's field set.
    const allowed: Record<string, unknown> = {}
    for (const key of ['code', 'description_ar', 'type', 'value', 'min_order_amount', 'max_discount_amount', 'usage_limit', 'expires_at', 'is_active'] as const) {
      if (key in body) allowed[key] = key === 'code' && typeof body.code === 'string' ? body.code.toUpperCase().trim() : body[key]
    }
    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update(allowed)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity(req, { action: 'update', entity: 'coupon', entity_id: id, meta: { fields: Object.keys(allowed) } })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity(req, { action: 'delete', entity: 'coupon', entity_id: id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
