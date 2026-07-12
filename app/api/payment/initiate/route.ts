import { NextRequest, NextResponse } from 'next/server'
import { initiatePayment } from '@/lib/payment'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface OrderItemRow {
  product_name_ar: string
  product_name_en: string
  quantity: number
  unit_price: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body as { orderId?: string }

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        customer_name,
        customer_phone,
        customer_email,
        payment_status,
        order_items (
          product_name_ar,
          product_name_en,
          quantity,
          unit_price
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 409 })
    }

    await supabaseAdmin
      .from('orders')
      .update({ payment_method: 'upayments', payment_status: 'unpaid' })
      .eq('id', order.id)

    const items = ((order.order_items as OrderItemRow[] | null) || []).map((item) => ({
      name: item.product_name_ar || item.product_name_en,
      description: item.product_name_en || item.product_name_ar,
      price: Number(item.unit_price),
      quantity: Number(item.quantity),
    }))

    const payment = await initiatePayment({
      orderId: order.id,
      orderNumber: order.order_number,
      amount: Number(order.total),
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      products: items,
    })

    return NextResponse.json({
      paymentUrl: payment.paymentUrl,
      paymentId: payment.paymentId,
    })
  } catch (error) {
    console.error('UPayments initiation error:', error)
    const message = error instanceof Error ? error.message : 'Failed to initiate payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
