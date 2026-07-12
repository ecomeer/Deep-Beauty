import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/payment'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function markOrderPaid(orderId: string) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      payment_method: 'upayments',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  return error
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const trackId = searchParams.get('track_id')
    const sessionId = searchParams.get('session_id')
    const invoiceId = searchParams.get('invoice_id')
    const requestedOrderId = searchParams.get('requested_order_id')
    const redirectResult = searchParams.get('result')

    let orderId = requestedOrderId || undefined
    let paid = redirectResult === 'CAPTURED'

    if (trackId || sessionId || invoiceId) {
      const result = await verifyPayment({ trackId, sessionId, invoiceId })
      paid = result.success
      orderId = result.orderId || orderId
    }

    if (!paid || !orderId) {
      return NextResponse.redirect(new URL('/payment-failed?reason=verification_failed', request.url))
    }

    const error = await markOrderPaid(orderId)
    if (error) {
      console.error('Failed to update order:', error)
      return NextResponse.redirect(new URL('/payment-failed?reason=database_error', request.url))
    }

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
            title: 'طلب جديد مدفوع!',
            body: `طلب #${order.order_number} من ${order.customer_name} - المبلغ: ${order.total} د.ك`,
            url: `/admin/orders/${orderId}`,
          }),
        })
      }
    } catch (notificationError) {
      console.error('Failed to send push notification:', notificationError)
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
