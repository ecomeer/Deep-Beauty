import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { VALID_TRANSITIONS, type OrderStatus } from '@/lib/order-status'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'orders')
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
  const _authErr = await requireAdmin(req, 'orders')
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

    if (!current) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    fromStatus = current.status as OrderStatus
    const allowed = VALID_TRANSITIONS[fromStatus] ?? []
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `لا يمكن الانتقال من "${current.status}" إلى "${body.status}"` },
        { status: 400 }
      )
    }
    updateFields.status = body.status
  }

  if (body.payment_status !== undefined) updateFields.payment_status = body.payment_status

  // Condition the update on the state used for transition validation.
  let query = supabaseAdmin.from('orders').update(updateFields).eq('id', id)
  if (fromStatus) query = query.eq('status', fromStatus)
  const { data, error } = await query.select().maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'تم تعديل حالة الطلب من مكان آخر — أعد المحاولة' }, { status: 409 })

  let reversalWarning = false
  let loyaltyWarning = false

  if (updateFields.status === 'cancelled') {
    const { error: reverseError } = await supabaseAdmin.rpc('cancel_order_effects_atomic', {
      p_order_id: id,
    })
    if (reverseError) {
      console.error('Failed to reverse cancelled order effects:', reverseError)
      reversalWarning = true
    }
  }

  // COD points are awarded only after the order is actually delivered. The
  // database RPC is idempotent, so retries cannot duplicate the award.
  if (updateFields.status === 'delivered') {
    const { error: loyaltyError } = await supabaseAdmin.rpc('award_order_loyalty_points', {
      p_order_id: id,
    })
    if (loyaltyError) {
      console.error('Failed to award delivered-order loyalty points:', loyaltyError)
      loyaltyWarning = true
    }
  }

  return NextResponse.json({
    data,
    ...(reversalWarning && { reversalWarning: true }),
    ...(loyaltyWarning && { loyaltyWarning: true }),
  })
}
