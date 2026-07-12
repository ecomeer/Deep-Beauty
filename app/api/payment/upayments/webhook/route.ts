import { NextRequest, NextResponse } from 'next/server'
import { getUPaymentsStatus } from '@/lib/upayments'
import { supabaseAdmin } from '@/lib/supabase-admin'

// notificationUrl target: safety net for payments where the customer
// never returns through the browser redirect. UPayments webhooks carry
// no signature, so the payload is never trusted directly — the payment
// is re-verified through the status API before any order update.
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
    // requested_order_id carries the order.id we sent when creating the charge
    const orderId = payload.requested_order_id || payload.order_id

    if (!trackId || !orderId) {
      return NextResponse.json({ received: true })
    }

    const status = await getUPaymentsStatus(trackId)

    if (status.success) {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
      if (error) console.error('UPayments webhook: order update failed:', error)
    } else {
      // Mark as cancelled only while the order is still pending —
      // never downgrade an order that was already confirmed.
      const { error } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'unpaid',
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('status', 'pending')
      if (error) console.error('UPayments webhook: order cancel failed:', error)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('UPayments webhook error:', error)
    // Always 200 so UPayments doesn't retry forever on our internal errors
    return NextResponse.json({ received: true })
  }
}
