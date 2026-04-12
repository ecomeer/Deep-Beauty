import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      orderNumber,
      customer_name,
      customer_phone,
      customer_email,
      address_line1,
      address_area,
      address_block,
      address_street,
      address_house,
      notes,
      subtotal,
      shipping_cost,
      total,
      coupon_code,
      coupon_discount,
      payment_method,
      user_id,
      items,
    } = body

    // Build order row
    const orderData: Record<string, unknown> = {
      order_number: orderNumber,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      address_line1,
      address_area,
      address_block,
      address_street,
      address_house,
      notes: notes || null,
      subtotal,
      shipping_cost,
      total: Math.max(0, total),
      coupon_code: coupon_code || null,
      coupon_discount: coupon_discount || 0,
      status: 'pending',
      payment_method,
      payment_status: 'unpaid',
    }
    if (user_id) orderData.user_id = user_id

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError || !order)
      return NextResponse.json({ error: orderError?.message || 'فشل في إنشاء الطلب' }, { status: 500 })

    // Insert order items
    await supabaseAdmin.from('order_items').insert(
      items.map((item: { id: string; name_ar: string; name_en: string; price: number; quantity: number }) => ({
        order_id: order.id,
        product_id: item.id,
        product_name_ar: item.name_ar,
        product_name_en: item.name_en,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }))
    )

    // Decrement stock for each item
    await Promise.all(
      items.map((item: { id: string; quantity: number }) =>
        supabaseAdmin.rpc('decrement_stock', { product_id: item.id, quantity: item.quantity })
      )
    )

    // Increment coupon usage
    if (coupon_code) {
      await supabaseAdmin.rpc('increment_coupon_usage', { coupon_code })
    }

    // Send push notification (fire and forget)
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      await fetch(`${siteUrl}/api/admin/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'طلب جديد! 🛍️',
          body: `طلب #${order.order_number} من ${customer_name} - ${payment_method === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'}`,
          url: `/admin/orders/${order.id}`,
        }),
      })
    } catch {
      // Non-critical
    }

    return NextResponse.json({ order })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطأ في الخادم'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
