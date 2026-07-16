import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/payment'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const message = searchParams.get('message') || 'unknown_error'
  const paymentId = searchParams.get('paymentId')

  // Never trust an order id from the query string. When MyFatoorah supplies a
  // payment id, resolve the order through its status API before cancelling.
  if (paymentId) {
    try {
      const result = await verifyPayment(paymentId)
      if (result.orderId && !result.success) {
        const { data } = await supabaseAdmin
          .from('orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', result.orderId)
          .eq('status', 'pending')
          .neq('payment_status', 'paid')
          .select('id')
          .maybeSingle()

        if (data) {
          const { error } = await supabaseAdmin.rpc('cancel_order_effects_atomic', {
            p_order_id: result.orderId,
          })
          if (error) console.error('Failed to reverse failed payment effects:', error)
        }
      }
    } catch (error) {
      console.error('Failed to verify MyFatoorah error callback:', error)
    }
  }

  return NextResponse.redirect(
    new URL(`/payment-failed?reason=${encodeURIComponent(message)}`, request.url)
  )
}
