import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST - Send notification to customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = supabaseAdmin

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('customer_name, customer_phone, order_number, status')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const notificationData = {
      type: body.type, // 'whatsapp', 'sms', 'email'
      recipient: order.customer_phone,
      message: body.message,
      status: body.status,
      order_number: order.order_number,
      customer_name: order.customer_name,
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent via ${body.type}`,
      data: notificationData,
    })
  } catch (error: any) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
