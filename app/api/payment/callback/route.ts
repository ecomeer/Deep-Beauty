import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/payment'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.redirect(new URL('/payment-failed?reason=missing_id', request.url))
    }

    // Verify payment status
    const result = await verifyPayment(paymentId)

    if (!result.success || !result.orderId) {
      return NextResponse.redirect(new URL('/payment-failed?reason=verification_failed', request.url))
    }

    // Update order status in database
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
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

    // Redirect to success page
    return NextResponse.redirect(new URL(`/order-success?id=${result.orderId}&paid=true`, request.url))
  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.redirect(new URL('/payment-failed?reason=error', request.url))
  }
}
