import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/payment'
import { supabaseAdmin } from '@/lib/supabase-admin'

const AMOUNT_EPSILON = 0.001 // KWD has 3 decimal places

export async function GET(request: NextRequest) {
  try {
    const paymentId = request.nextUrl.searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.redirect(new URL('/payment-failed?reason=missing_id', request.url))
    }

    const result = await verifyPayment(paymentId)

    if (!result.success || !result.orderId || result.amount == null) {
      return NextResponse.redirect(new URL('/payment-failed?reason=verification_failed', request.url))
    }

    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id,order_number,customer_name,total,status,payment_status')
      .eq('id', result.orderId)
      .maybeSingle()

    if (fetchError || !order) {
      return NextResponse.redirect(new URL('/payment-failed?reason=verification_failed', request.url))
    }

    if (order.status === 'cancelled') {
      return NextResponse.redirect(new URL('/payment-failed?reason=order_cancelled', request.url))
    }

    if (Math.abs(result.amount - Number(order.total)) > AMOUNT_EPSILON) {
      console.error('MyFatoorah callback: amount mismatch', {
        orderId: order.id,
        expectedTotal: order.total,
        paidAmount: result.amount,
      })
      return NextResponse.redirect(new URL('/payment-failed?reason=verification_failed', request.url))
    }

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

    // Send push notification for the first successful transition only.
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'طلب جديد مدفوع! 💳',
          body: `طلب #${order.order_number} من ${order.customer_name} - المبلغ: ${order.total} د.ك`,
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
    console.error('Payment callback error:', error)
    return NextResponse.redirect(new URL('/payment-failed?reason=error', request.url))
  }
}
