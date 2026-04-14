import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/payment'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const paymentId = request.nextUrl.searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.redirect(new URL('/payment-failed?reason=missing_id', request.url))
    }

    const result = await verifyPayment(paymentId)

    if (!result.success || !result.orderId) {
      return NextResponse.redirect(new URL('/payment-failed?reason=verification_failed', request.url))
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', result.orderId)

    if (error) {
      console.error('Failed to update order:', error)
      return NextResponse.redirect(new URL('/payment-failed?reason=database_error', request.url))
    }

    // Send push notification for new order
    try {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('order_number, customer_name, total')
        .eq('id', result.orderId)
        .single()

      if (order) {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/push/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'طلب جديد مدفوع! 💳',
            body: `طلب #${order.order_number} من ${order.customer_name} - المبلغ: ${order.total} د.ك`,
            url: `/admin/orders/${result.orderId}`
          })
        })
      }
    } catch (notifError) {
      console.error('Failed to send push notification:', notifError)
    }

    return NextResponse.redirect(new URL(`/order-success?id=${result.orderId}&paid=true`, request.url))
  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.redirect(new URL('/payment-failed?reason=error', request.url))
  }
}
