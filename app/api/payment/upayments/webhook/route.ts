import { NextRequest, NextResponse } from 'next/server'
import {
  getUPaymentsStatus,
  isTerminalUPaymentsFailure,
} from '@/lib/upayments'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildPaidOrderPatch } from '@/lib/payment-order'
import { sendAdminPushNotification } from '@/lib/push-notifications'

const AMOUNT_EPSILON = 0.001 // KWD has 3 decimal places

// notificationUrl target: safety net for payments where the customer
// never returns through the browser redirect. UPayments webhooks carry
// no signature, so NOTHING in the request body is trusted — track_id is
// the only thing we take from it, and the order id / amount used for the
// DB update are re-derived from UPayments' own status-check response for
// that track_id, never from the webhook body's order_id field.
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    let payload: Record<string, string> = {}
    try {
      payload = JSON.parse(rawBody)
    } catch {
      payload = Object.fromEntries(new URLSearchParams(rawBody))
    }

    const trackId = payload.track_id
    if (!trackId) {
      return NextResponse.json({ received: true })
    }

    const status = await getUPaymentsStatus(trackId)
    if (!status.orderId) {
      return NextResponse.json({ received: true })
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, total, status, payment_status, paid_at, confirmed_at')
      .eq('id', status.orderId)
      .maybeSingle()

    if (!order) {
      return NextResponse.json({ received: true })
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ received: true })
    }

    if (status.success) {
      const amountMatches =
        status.amount != null && Math.abs(status.amount - Number(order.total)) <= AMOUNT_EPSILON
      const referenceMatches = !status.orderNumber || status.orderNumber === order.order_number
      if (!amountMatches || !referenceMatches) {
        console.error('UPayments webhook: amount/reference mismatch', {
          orderId: order.id,
          expectedTotal: order.total,
          paidAmount: status.amount,
        })
        return NextResponse.json({ received: true })
      }

      const patch = buildPaidOrderPatch(order)
      if (!patch) {
        return NextResponse.json({ received: true })
      }

      const { data: updated, error } = await supabaseAdmin
        .from('orders')
        .update(patch)
        .eq('id', order.id)
        .neq('status', 'cancelled')
        .select('id')
        .maybeSingle()

      if (error) {
        console.error('UPayments webhook: order update failed:', error)
      } else if (updated) {
        try {
          await sendAdminPushNotification({
            title: 'طلب جديد مدفوع! 💳',
            body: `طلب #${order.order_number} - المبلغ: ${order.total} د.ك`,
            url: `/admin/orders/${order.id}`,
          })
        } catch (notifError) {
          console.error('UPayments webhook: push notification failed:', notifError)
        }
      }
    } else if (isTerminalUPaymentsFailure(status.result)) {
      // Cancel and restock only for an explicit terminal gateway failure.
      // Pending/processing/unknown states remain pending for a later retry.
      const now = new Date().toISOString()
      const { error, data } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'unpaid',
          status: 'cancelled',
          cancelled_at: now,
          updated_at: now,
        })
        .eq('id', order.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle()

      if (error) {
        console.error('UPayments webhook: order cancel failed:', error)
      } else if (data) {
        const { error: restockErr } = await supabaseAdmin.rpc('restock_order_atomic', {
          p_order_id: order.id,
        })
        if (restockErr) console.error('Failed to restock cancelled order:', restockErr)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('UPayments webhook error:', error)
    // Always 200 so UPayments doesn't retry forever on our internal errors.
    return NextResponse.json({ received: true })
  }
}
