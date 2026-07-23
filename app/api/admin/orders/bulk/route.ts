import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { VALID_TRANSITIONS, ORDER_STATUSES, type OrderStatus } from '@/lib/order-status'

// Bulk order status change in a single HTTP request (replacing the per-row
// fetch loop in the orders page). Each order is validated against
// VALID_TRANSITIONS and gets the same cancel/deliver side effects as the
// single-order PATCH; orders whose current status can't transition to the
// target are skipped and counted as failures.
export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'orders')
  if (_authErr) return _authErr
  try {
    const { ids, status } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No ids provided' }, { status: 400 })
    }
    if (!ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const target = status as OrderStatus
    let updated = 0
    let failed = 0

    for (const id of ids) {
      const { data: current } = await supabaseAdmin
        .from('orders')
        .select('status')
        .eq('id', id)
        .single()
      if (!current) { failed++; continue }

      const fromStatus = current.status as OrderStatus
      if (!(VALID_TRANSITIONS[fromStatus] ?? []).includes(target)) { failed++; continue }

      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ status: target })
        .eq('id', id)
        .eq('status', fromStatus)
        .select('id')
        .maybeSingle()
      if (error || !data) { failed++; continue }

      if (target === 'cancelled') {
        await supabaseAdmin.rpc('cancel_order_effects_atomic', { p_order_id: id })
      } else if (target === 'delivered') {
        await supabaseAdmin.rpc('award_order_loyalty_points', { p_order_id: id })
      }
      updated++
    }

    return NextResponse.json({ ok: true, updated, failed })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
