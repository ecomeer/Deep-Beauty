import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { VALID_TRANSITIONS, type OrderStatus } from '@/lib/order-status'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { id } = await params
  const [orderRes, itemsRes, trackingRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').eq('id', id).single(),
    supabaseAdmin.from('order_items').select('*').eq('order_id', id),
    supabaseAdmin.from('order_tracking').select('*').eq('order_id', id).order('created_at', { ascending: false }),
  ])
  if (orderRes.error || !orderRes.data) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  return NextResponse.json({ order: orderRes.data, items: itemsRes.data || [], tracking: trackingRes.data || [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { id } = await params
  const body = await req.json()

  const updateFields: Record<string, string> = {}

  if (body.status !== undefined) {
    const { data: current } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', id)
      .single()

    const allowed = VALID_TRANSITIONS[current?.status as OrderStatus] ?? []
    if (current && !allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `لا يمكن الانتقال من "${current.status}" إلى "${body.status}"` },
        { status: 400 }
      )
    }
    updateFields.status = body.status
  }

  if (body.payment_status !== undefined) updateFields.payment_status = body.payment_status

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
