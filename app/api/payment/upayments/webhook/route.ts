import { NextRequest, NextResponse } from 'next/server'
import { getUPaymentsStatus } from '@/lib/upayments'
import { supabaseAdmin } from '@/lib/supabase-admin'

const AMOUNT_EPSILON = 0.001 // KWD has 3 decimal places
const TERMINAL_FAILURE_RESULTS = new Set([
  'CANCELLED',
  'FAILED',
  'DECLINED',
  'ABANDONED',
  'EXPIRED',
  'VOIDED',
])

// notificationUrl target: safety net for payments where the customer
// never returns through the browser redirect. UPayments webhooks carry
// no signature, so NOTHING in the request body is trusted — track_id is
// the only thing we take from it, and the order id / amount used for the
// DB update are re-derived from UPayments' own status-check response.
export async function POST(request: NextRequest) {
  try {
    // The payload may arrive as JSON or form-encoded.
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
      .select('id, order_number, total, status, payment_status')
      .eq('id', status.orderId)
      .maybeSingle()

    if (!order) {
      return NextResponse.json({ received: true })
    }

    // Idempotent: a delayed/duplicate webhook for an already-paid order may
    // backfill an interrupted loyalty award, but cannot award it twice.
    if (order.payment_status === 'paid') {
      await supabaseAdmin.rpc('award_order_loyalty_points', { p_order_id: order.id })
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

      // A cancelled order has already had its stock restored — do not revive it.
      const { error, data } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)
        .neq('status', 'cancelled')
        .select('id')
        .maybeSingle()

      if (error) {
        console.error('UPayments webhook: order update failed:', error)
      } else if (data) {
        const { error: loyaltyError } = await supabaseAdmin.rpc('award_order_loyalty_points', {
          p_order_id: order.id,
        })
        if (loyaltyError) console.error('UPayments webhook: loyalty award failed:', loyaltyError)
      }
    } else if (status.result && TERMINAL_FAILURE_RESULTS.has(status.result.toUpperCase())) {
      // Only terminal gateway failures cancel an order. Pending/unknown states
      // keep their reservation until the payment-expiry cleanup handles them.
      const { error, data } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'unpaid',
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle()

      if (error) {
        console.error('UPayments webhook: order cancel failed:', error)
      } else if (data) {
        const { error: reverseError } = await supabaseAdmin.rpc('cancel_order_effects_atomic', {
          p_order_id: order.id,
        })
        if (reverseError) console.error('UPayments webhook: cancellation reversal failed:', reverseError)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('UPayments webhook error:', error)
    // Always 200 so UPayments doesn't retry forever on our internal errors.
    return NextResponse.json({ received: true })
  }
}
