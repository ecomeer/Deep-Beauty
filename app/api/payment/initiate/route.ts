import { NextRequest, NextResponse } from 'next/server'
import { initiatePayment } from '@/lib/payment'
import { isUPaymentsConfigured, createUPaymentsCharge } from '@/lib/upayments'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Amount, order number, and customer details come from the DB —
    // never from the client — so the charge always matches the order.
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, total, customer_name, customer_phone, customer_email, payment_status')
      .eq('id', orderId)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 409 })
    }

    await supabaseAdmin
      .from('orders')
      .update({ payment_method: 'online', payment_status: 'unpaid' })
      .eq('id', orderId)

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
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}
