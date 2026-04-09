import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('order')
    const phone = searchParams.get('phone')
    
    if (!orderNumber || !phone) {
      return NextResponse.json(
        { error: 'Order number and phone required' },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Find order by order number and phone
    const { data: order, error: orderError } = await supabase
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
    
    // Get tracking history
    const { data: tracking, error: trackingError } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', order.id)
      .eq('is_customer_visible', true)
      .order('created_at', { ascending: false })
    
    if (trackingError) throw trackingError
    
    return NextResponse.json({
      order,
      tracking: tracking || []
    })
  } catch (error: any) {
    console.error('Track order error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
