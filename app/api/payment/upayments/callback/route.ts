import { NextRequest, NextResponse } from 'next/server'
import { getUPaymentsStatus } from '@/lib/upayments'
import { supabaseAdmin } from '@/lib/supabase-admin'

const AMOUNT_EPSILON = 0.001 // KWD has 3 decimal places

// returnUrl / cancelUrl target. The database identity and amount always come
// from UPayments' status API for track_id, never from query order values.
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const trackId = params.get('track_id')
    const cancelled = params.get('cancelled')

    if (!trackId) {
      return NextResponse.redirect(new URL('/payment-failed?reason=missing_id', request.url))
    }

    const status = await getUPaymentsStatus(trackId)

    if (cancelled === '1') {
      // A query flag alone is not enough to choose an order. Resolve it from
      // UPayments and never cancel a payment that the gateway says captured.
      if (status.orderId && !status.success) {
        const { data } = await supabaseAdmin
          .from('orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', status.orderId)
          .eq('status', 'pending')
          .neq('payment_status', 'paid')
          .select('id')
          .maybeSingle()

        if (data) {
          const { error } = await supabaseAdmin.rpc('cancel_order_effects_atomic', {
            p_order_id: status.orderId,
          })
          if (error) console.error('Failed to reverse cancelled UPayments order:', error)
        }
      }
      return NextResponse.redirect(new URL('/payment-failed?reason=cancelled', request.url))
    }

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

    if (order.status === 'cancelled') {
      return NextResponse.redirect(new URL('/payment-failed?reason=order_cancelled', request.url))
    }

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

    // Revisiting the callback may backfill an interrupted loyalty award, but
    // cannot award twice because the RPC flips a guarded database flag.
    if (order.payment_status === 'paid') {
      await supabaseAdmin.rpc('award_order_loyalty_points', { p_order_id: order.id })
      return NextResponse.redirect(
        new URL(`/order-success?id=${order.id}&num=${encodeURIComponent(order.order_number)}&paid=true`, request.url)
      )
    }

    const { data: updated, error } = await supabaseAdmin
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
      console.error('Failed to update order:', error)
      return NextResponse.redirect(new URL('/payment-failed?reason=database_error', request.url))
    }
    if (!updated) {
      return NextResponse.redirect(new URL('/payment-failed?reason=order_cancelled', request.url))
    }

    const { error: loyaltyError } = await supabaseAdmin.rpc('award_order_loyalty_points', {
      p_order_id: order.id,
    })
    if (loyaltyError) console.error('Failed to award loyalty points:', loyaltyError)

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
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
