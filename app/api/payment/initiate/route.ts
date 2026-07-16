import { NextRequest, NextResponse } from 'next/server'
import { initiatePayment } from '@/lib/payment'
import { isUPaymentsConfigured, createUPaymentsCharge } from '@/lib/upayments'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function cancelUnpayableOrder(orderId: string) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'pending')
    .neq('payment_status', 'paid')
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Failed to cancel unpayable order:', error)
    return
  }

  if (data) {
    const { error: reverseError } = await supabaseAdmin.rpc('cancel_order_effects_atomic', {
      p_order_id: orderId,
    })
    if (reverseError) console.error('Failed to reverse unpayable order effects:', reverseError)
  }
}

export async function POST(request: NextRequest) {
  let resolvedOrderId: string | null = null

  try {
    const body = await request.json()
    const { orderId, orderNumber } = body as { orderId?: string; orderNumber?: string }

    if (!orderId || !orderNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Amount and customer details come from the DB. The order number acts as
    // a possession token for guest checkout and must match the supplied UUID.
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, total, customer_name, customer_phone, customer_email, payment_status, status')
      .eq('id', orderId)
      .eq('order_number', orderNumber)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    resolvedOrderId = order.id

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 409 })
    }
    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Order cancelled' }, { status: 409 })
    }

    await supabaseAdmin
      .from('orders')
      .update({
        payment_method: 'online',
        payment_status: 'unpaid',
        payment_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'pending')

    const paymentRequest = {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: Number(order.total),
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email || undefined,
    }

    // UPayments (KNET / cards / wallets) takes precedence when configured;
    // otherwise fall back to MyFatoorah.
    if (isUPaymentsConfigured()) {
      const payment = await createUPaymentsCharge(paymentRequest)
      return NextResponse.json({ paymentUrl: payment.paymentUrl, gateway: 'upayments' })
    }

    if (!process.env.MYFATOORAH_TOKEN) {
      await cancelUnpayableOrder(order.id)
      return NextResponse.json(
        { error: 'لم يتم تفعيل أي بوابة دفع — اضبط UPAYMENTS_TOKEN أو MYFATOORAH_TOKEN' },
        { status: 503 }
      )
    }

    const payment = await initiatePayment(paymentRequest)

    return NextResponse.json({
      paymentUrl: payment.paymentUrl,
      paymentId: payment.paymentId,
      gateway: 'myfatoorah',
    })
  } catch (error) {
    console.error('Payment initiation error:', error)
    if (resolvedOrderId) await cancelUnpayableOrder(resolvedOrderId)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}
