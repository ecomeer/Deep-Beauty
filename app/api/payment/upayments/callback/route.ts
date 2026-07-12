import { NextRequest, NextResponse } from 'next/server'
import { getUPaymentsStatus } from '@/lib/upayments'
import { supabaseAdmin } from '@/lib/supabase-admin'

// returnUrl / cancelUrl target: UPayments redirects the customer here
// with track_id appended; `order` and `cancelled` are set by us when
// creating the charge.
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const orderId = params.get('order')
    const trackId = params.get('track_id')
    const cancelled = params.get('cancelled')

    if (cancelled === '1') {
      return NextResponse.redirect(new URL('/payment-failed?reason=cancelled', request.url))
    }

    if (!orderId || !trackId) {
      return NextResponse.redirect(new URL('/payment-failed?reason=missing_id', request.url))
    }

    const status = await getUPaymentsStatus(trackId)

    if (!status.success) {
      return NextResponse.redirect(new URL('/payment-failed?reason=verification_failed', request.url))
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) {
      console.error('Failed to update order:', error)
      return NextResponse.redirect(new URL('/payment-failed?reason=database_error', request.url))
    }

    // Notify admins about the paid order (non-critical)
    let orderNumber: string | null = null
    try {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('order_number, customer_name, total')
        .eq('id', orderId)
        .single()

      if (order) {
        orderNumber = order.order_number
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/push/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'طلب جديد مدفوع! 💳',
            body: `طلب #${order.order_number} من ${order.customer_name} - المبلغ: ${order.total} د.ك`,
            url: `/admin/orders/${orderId}`,
          }),
        })
      }
    } catch (notifError) {
      console.error('Failed to send push notification:', notifError)
    }

    const query = orderNumber
      ? `/order-success?id=${orderId}&num=${encodeURIComponent(orderNumber)}&paid=true`
      : `/order-success?id=${orderId}&paid=true`
    return NextResponse.redirect(new URL(query, request.url))
  } catch (error) {
    console.error('UPayments callback error:', error)
    return NextResponse.redirect(new URL('/payment-failed?reason=error', request.url))
  }
}
