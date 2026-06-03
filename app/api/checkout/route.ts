import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkoutLimiter } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting — derive IP from forwarded headers
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    if (!checkoutLimiter(ip)) {
      return NextResponse.json({ error: 'طلبات كثيرة، يرجى الانتظار قليلاً' }, { status: 429 })
    }

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
      subtotal = 0,
      shipping_cost,
      total,
      coupon_code,
      coupon_discount = 0,
      payment_method,
      user_id,
      items,
    } = body

    // Validate required fields
    if (!customer_name?.trim()) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
    if (!customer_phone?.trim()) return NextResponse.json({ error: 'رقم الهاتف مطلوب' }, { status: 400 })
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'السلة فارغة' }, { status: 400 })
    if (!total || total <= 0) return NextResponse.json({ error: 'مبلغ الطلب غير صحيح' }, { status: 400 })
    if (items.length > 50) return NextResponse.json({ error: 'عدد المنتجات يتجاوز الحد المسموح' }, { status: 400 })

    // Build order payload for atomic RPC
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
      subtotal: Number(subtotal) || 0,
      shipping_cost: Number(shipping_cost) || 0,
      total: Math.max(0, Number(total)),
      coupon_code: coupon_code || null,
      coupon_discount: Number(coupon_discount) || 0,
      status: 'pending',
      payment_method,
      payment_status: 'unpaid',
    }
    if (user_id) orderData.user_id = user_id

    const itemsPayload = items.map(
      (item: { id: string; name_ar: string; name_en: string; price: number; quantity: number }) => ({
        product_id: item.id,
        product_name_ar: item.name_ar,
        product_name_en: item.name_en,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      })
    )

    // Atomically create order + items + decrement stock via DB transaction
    const { data: orderJson, error: rpcError } = await supabaseAdmin.rpc('create_order_atomic', {
      p_order: orderData,
      p_items: itemsPayload,
    })

    if (rpcError || !orderJson)
      return NextResponse.json({ error: rpcError?.message || 'فشل في إنشاء الطلب' }, { status: 500 })

    const order = orderJson as Record<string, unknown>

    // Increment coupon usage
    if (coupon_code && coupon_discount > 0) {
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
          body: `طلب #${order['order_number']} من ${customer_name} - ${payment_method === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'}`,
          url: `/admin/orders/${order['id']}`,
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
