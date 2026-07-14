import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUserId, requireAdmin } from '@/lib/auth-admin'
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

  // When changing status, condition the update on the order still being in
  // the state we just validated the transition from — Postgres serializes
  // concurrent UPDATEs on the same row, so a second, racing PATCH to the
  // same terminal status won't match and won't restock a second time.
  let data: Record<string, unknown> | null = null
  let error: { message: string } | null = null
  if (fromStatus) {
    const createdBy = await getAuthenticatedUserId(req)
    if (!createdBy) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const transition = await supabaseAdmin.rpc('transition_order_with_tracking', {
      p_order_id: id,
      p_expected_status: fromStatus,
      p_new_status: updateFields.status,
      p_created_by: createdBy,
    })
    data = transition.data as Record<string, unknown> | null
    error = transition.error ? { message: transition.error.message } : null
  } else if (Object.keys(updateFields).length > 0) {
    const result = await supabaseAdmin.from('orders').update(updateFields).eq('id', id).select().maybeSingle()
    data = result.data as Record<string, unknown> | null
    error = result.error ? { message: result.error.message } : null
  } else {
    return NextResponse.json({ error: 'لا توجد تغييرات' }, { status: 400 })
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'تم تعديل حالة الطلب من مكان آخر — أعد المحاولة' }, { status: 409 })

  let restockWarning = false
  if (updateFields.status === 'cancelled') {
    const { error: restockErr } = await supabaseAdmin.rpc('restock_order_atomic', { p_order_id: id })
    if (restockErr) {
      // The status change itself already committed and must not be rolled
      // back here — surface the restock failure instead of only logging it,
      // so admins have a way to notice and reconcile stock manually.
      console.error('Failed to restock cancelled order:', restockErr)
      restockWarning = true
    }

    // Reverse this order's loyalty-points effect (non-critical, best-effort).
    const pointsDelta = Number(data.loyalty_points_redeemed ?? 0) - Number(data.loyalty_points_earned ?? 0)
    if (pointsDelta !== 0 && data.user_id) {
      try { await supabaseAdmin.rpc('increment_loyalty_points', { p_user_id: data.user_id, p_delta: pointsDelta }) } catch { /* non-critical */ }
    }
  }

  return NextResponse.json({ data, ...(restockWarning && { restockWarning: true }) })
}
