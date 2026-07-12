import { NextRequest, NextResponse } from 'next/server'
import { getUPaymentsStatus } from '@/lib/upayments'
import { supabaseAdmin } from '@/lib/supabase-admin'

const AMOUNT_EPSILON = 0.001 // KWD has 3 decimal places

// returnUrl / cancelUrl target: UPayments redirects the customer here
// with track_id appended; `order` and `cancelled` are set by us when
// creating the charge. `order` is only used as a fallback for the
// redirect URL — the DB update always keys off the order id/amount
// recorded by UPayments against this track_id, never the query param,
// so a captured track_id can't be replayed against a different order.
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const trackId = params.get('track_id')
    const cancelled = params.get('cancelled')

    if (cancelled === '1') {
      return NextResponse.redirect(new URL('/payment-failed?reason=cancelled', request.url))
    }

    if (!trackId) {
      return NextResponse.redirect(new URL('/payment-failed?reason=missing_id', request.url))
    }

    const status = await getUPaymentsStatus(trackId)

    if (!status.success || !status.orderId || status.amount == null) {
      return NextResponse.redirect(new URL('/payment-failed?reason=verification_failed', request.url))
    }

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, total, status, payment_status')
      .eq('id', status.orderId)
      .maybeSingle()

    if (fetchErr || !order) {
      return NextResponse.redirect(new URL('/payment-failed?reason=verification_failed', request.url))
    }

    // A cancelled order has already had its stock restocked — reviving it
    // via a stale payment link would confirm an order with no reserved
    // inventory. The customer needs to place a new order instead.
    if (order.status === 'cancelled') {
      return NextResponse.redirect(new URL('/payment-failed?reason=order_cancelled', request.url))
    }

    // Defense in depth: the paid amount and order number must match what
    // we originally submitted for this order.
    const amountMatches = Math.abs(status.amount - Number(order.total)) <= AMOUNT_EPSILON
    const referenceMatches = !status.orderNumber || status.orderNumber === order.order_number
    if (!amountMatches || !referenceMatches) {
      console.error('UPayments callback: amount/reference mismatch', {
        orderId: order.id,
        expectedTotal: order.total,
        paidAmount: status.amount,
        expectedRef: order.order_number,
        paidRef: status.orderNumber,
      })
      return NextResponse.redirect(new URL('/payment-failed?reason=verification_failed', request.url))
    }

    // Idempotent: a customer refreshing/revisiting this URL shouldn't re-notify admins.
    if (order.payment_status === 'paid') {
      return NextResponse.redirect(
        new URL(`/order-success?id=${order.id}&num=${encodeURIComponent(order.order_number)}&paid=true`, request.url)
      )
    }

    // Re-guard against cancelled here too, in case the order was cancelled
    // between the fetch above and this update.
    const { data: updated, error } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .neq('status', 'cancelled')
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Failed to update order:', error)
      return NextResponse.redirect(new URL('/payment-failed?reason=database_error', request.url))
    }
    if (!updated) {
      return NextResponse.redirect(new URL('/payment-failed?reason=order_cancelled', request.url))
    }

    // Notify admins about the paid order (non-critical)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'طلب جديد مدفوع! 💳',
          body: `طلب #${order.order_number} - المبلغ: ${order.total} د.ك`,
          url: `/admin/orders/${order.id}`,
        }),
      })
    } catch (notifError) {
      console.error('Failed to send push notification:', notifError)
    }

    return NextResponse.redirect(
      new URL(`/order-success?id=${order.id}&num=${encodeURIComponent(order.order_number)}&paid=true`, request.url)
    )
  } catch (error) {
    console.error('UPayments callback error:', error)
    return NextResponse.redirect(new URL('/payment-failed?reason=error', request.url))
  }
}
