import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/payment'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendAdminPushNotification } from '@/lib/push-notifications'

// MyFatoorah IPN webhook — called server-to-server when payment status changes.
// MyFatoorah sends POST with { PaymentId: string } in the body.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const paymentId = body?.PaymentId ?? body?.paymentId

    if (!paymentId || typeof paymentId !== 'string') {
      return NextResponse.json({ error: 'Missing PaymentId' }, { status: 400 })
    }

    const result = await verifyPayment(paymentId)

    if (!result.success || !result.orderId) {
      return NextResponse.json({ received: true, updated: false })
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', result.orderId)
      .eq('payment_status', 'unpaid')

    if (error) {
      console.error('Webhook: failed to update order', error)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    try {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('order_number, customer_name, total')
        .eq('id', result.orderId)
        .single()

      if (order) {
        await sendAdminPushNotification({
          title: 'طلب جديد مدفوع! 💳',
          body: `طلب #${order.order_number} من ${order.customer_name} - المبلغ: ${order.total} د.ك`,
          url: `/admin/orders/${result.orderId}`,
        })
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json({ received: true, updated: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook processing error'
    console.error('Webhook error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
