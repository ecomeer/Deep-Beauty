import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getClientIp, trackOrderLimiter } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    if (!trackOrderLimiter(getClientIp(request))) {
      return NextResponse.json({ error: 'طلبات كثيرة، يرجى الانتظار قليلاً' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('order')
    const phone = searchParams.get('phone')

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { error: 'Order number and phone required' },
        { status: 400 }
      )
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        customer_name,
        customer_phone,
        total,
        payment_method,
        payment_status,
        shipping_address,
        created_at,
        order_items (
          quantity,
          price,
          product:product_id (name_ar, images)
        )
      `)
      .eq('order_number', orderNumber)
      .eq('customer_phone', phone)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const { data: tracking } = await supabaseAdmin
      .from('order_tracking')
      .select('id,status,note,location,created_at')
      .eq('order_id', order.id)
      .eq('is_customer_visible', true)
      .order('created_at', { ascending: false })

    return NextResponse.json({ order, tracking: tracking || [] })
  } catch (error: unknown) {
    console.error('Track order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Track order failed' },
      { status: 500 }
    )
  }
}
