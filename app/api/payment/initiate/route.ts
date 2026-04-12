import { NextRequest, NextResponse } from 'next/server'
import { initiatePayment } from '@/lib/payment'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, orderNumber, amount, customerName, customerPhone, customerEmail } = body

    if (!orderId || !amount || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await supabaseAdmin
      .from('orders')
      .update({ payment_method: 'online', payment_status: 'unpaid' })
      .eq('id', orderId)

    const payment = await initiatePayment({
      orderId,
      orderNumber,
      amount,
      customerName,
      customerPhone,
      customerEmail,
    })

    return NextResponse.json({
      paymentUrl: payment.paymentUrl,
      paymentId: payment.paymentId,
    })
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}
