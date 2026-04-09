import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// POST - Send notification to customer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const supabase = await createServerSupabaseClient()
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('customer_name, customer_phone, order_number, status')
      .eq('id', params.id)
      .single()
    
    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // In a real implementation, you would:
    // 1. Send WhatsApp message via API
    // 2. Send SMS via provider
    // 3. Send Email via SMTP
    
    // For now, we'll just log and return success
    const notificationData = {
      type: body.type, // 'whatsapp', 'sms', 'email'
      recipient: order.customer_phone,
      message: body.message,
      status: body.status,
      order_number: order.order_number,
      customer_name: order.customer_name
    }
    
    console.log('Notification sent:', notificationData)
    
    // Log notification in database (optional)
    // await supabase.from('notifications_log').insert([...])
    
    return NextResponse.json({
      success: true,
      message: `Notification sent via ${body.type}`,
      data: notificationData
    })
  } catch (error: any) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
