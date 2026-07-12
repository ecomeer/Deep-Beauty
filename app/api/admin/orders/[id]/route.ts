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
  let fromStatus: OrderStatus | undefined

  if (body.status !== undefined) {
    const { data: current } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', id)
      .single()

    fromStatus = current?.status as OrderStatus | undefined
    const allowed = VALID_TRANSITIONS[fromStatus as OrderStatus] ?? []
    if (current && !allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `لا يمكن الانتقال من "${current.status}" إلى "${body.status}"` },
        { status: 400 }
      )
    }
    updateFields.status = body.status
  }

  if (body.payment_status !== undefined) updateFields.payment_status = body.payment_status

  // When changing status, condition the update on the order still being in
  // the state we just validated the transition from — Postgres serializes
  // concurrent UPDATEs on the same row, so a second, racing PATCH to the
  // same terminal status won't match and won't restock a second time.
  let query = supabaseAdmin.from('orders').update(updateFields).eq('id', id)
  if (fromStatus) query = query.eq('status', fromStatus)
  const { data, error } = await query.select().maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'تم تعديل حالة الطلب من مكان آخر — أعد المحاولة' }, { status: 409 })

  if (updateFields.status === 'cancelled') {
    const { error: restockErr } = await supabaseAdmin.rpc('restock_order_atomic', { p_order_id: id })
    if (restockErr) console.error('Failed to restock cancelled order:', restockErr)
  }

  return NextResponse.json({ data })
}
