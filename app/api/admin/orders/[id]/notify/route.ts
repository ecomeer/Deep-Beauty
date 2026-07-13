import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { sendEmail, orderStatusEmail } from '@/lib/email'
import { toWhatsAppPhone } from '@/lib/utils'

// POST - Send push notification to all admin subscribers about order update
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const _authErr = await requireAdmin(request, 'orders')
  if (_authErr) return _authErr

  try {
    const { id } = await params
    const body = await request.json()

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('customer_name, customer_phone, customer_email, order_number, status, total')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Send push notification via the push/send endpoint
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    try {
      await fetch(`${siteUrl}/api/admin/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
        body: JSON.stringify({
          title: `تحديث طلب ${order.order_number}`,
          body: body.message || `الحالة الجديدة: ${body.status}`,
          url: `/admin/orders/${id}`,
        }),
      })
    } catch { /* non-critical */ }

    // Email the customer the status update (non-critical, skipped without RESEND_API_KEY)
    let emailSent = false
    if (order.customer_email) {
      const { subject, html } = orderStatusEmail(
        {
          order_number: order.order_number,
          customer_name: order.customer_name,
          total: order.total,
          status: body.status || order.status,
        },
        body.message
      )
      const result = await sendEmail({ to: order.customer_email, subject, html })
      emailSent = result.sent
    }

    // Return WhatsApp link for manual customer notification
    const phone = order.customer_phone ? toWhatsAppPhone(order.customer_phone) : ''
    const waMessage = encodeURIComponent(body.message || `مرحباً ${order.customer_name}، تم تحديث طلبك ${order.order_number}.`)
    const whatsappUrl = phone ? `https://wa.me/${phone}?text=${waMessage}` : null

    return NextResponse.json({
      success: true,
      emailSent,
      whatsappUrl,
      order_number: order.order_number,
      customer_phone: order.customer_phone,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
