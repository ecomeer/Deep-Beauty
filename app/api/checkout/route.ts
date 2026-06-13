import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkoutLimiter } from '@/lib/rate-limit'
import { calculateShipping, ShippingZone } from '@/lib/shipping'
import { GulfCountry } from '@/lib/currency'

interface CheckoutItem {
  id: string
  quantity: number
}

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
      coupon_code,
      country_code,
      payment_method,
      user_id,
      items,
    } = body as {
      orderNumber: string
      customer_name: string
      customer_phone: string
      customer_email?: string
      address_line1: string
      address_area: string
      address_block: string
      address_street: string
      address_house: string
      notes?: string
      coupon_code?: string
      country_code?: string
      payment_method: string
      user_id?: string
      items: CheckoutItem[]
    }

    // Validate required fields
    if (!customer_name?.trim()) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
    if (!customer_phone?.trim()) return NextResponse.json({ error: 'رقم الهاتف مطلوب' }, { status: 400 })
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'السلة فارغة' }, { status: 400 })
    if (items.length > 50) return NextResponse.json({ error: 'عدد المنتجات يتجاوز الحد المسموح' }, { status: 400 })
    for (const item of items) {
      if (!item?.id || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json({ error: 'عناصر السلة غير صحيحة' }, { status: 400 })
      }
    }

    // ── Re-validate prices server-side (never trust client totals) ──
    const productIds = items.map((item) => item.id)
    const { data: dbProducts, error: dbErr } = await supabaseAdmin
      .from('products')
      .select('id, price, is_active, name_ar, name_en')
      .in('id', productIds)

    if (dbErr) {
      return NextResponse.json({ error: 'فشل في التحقق من المنتجات' }, { status: 500 })
    }

    const productMap = new Map((dbProducts || []).map((p) => [p.id, p]))
    let subtotal = 0
    for (const item of items) {
      const product = productMap.get(item.id)
      if (!product || !product.is_active) {
        return NextResponse.json({ error: 'أحد المنتجات غير متوفر حالياً' }, { status: 400 })
      }
      subtotal += product.price * item.quantity
    }

    // ── Re-validate coupon server-side ──
    let discount = 0
    let appliedCouponCode: string | null = null
    if (coupon_code) {
      const { data: couponData, error: couponErr } = await supabaseAdmin.rpc('validate_and_use_coupon', {
        p_code: coupon_code.trim().toUpperCase(),
        p_subtotal: subtotal,
      })

      if (couponErr) {
        const msg = couponErr.message ?? ''
        if (msg.includes('INVALID_CODE')) return NextResponse.json({ error: 'كود الخصم غير صحيح' }, { status: 400 })
        if (msg.includes('EXPIRED')) return NextResponse.json({ error: 'كود الخصم منتهي الصلاحية' }, { status: 400 })
        if (msg.includes('LIMIT_REACHED')) return NextResponse.json({ error: 'تجاوز كود الخصم الحد الأقصى للاستخدام' }, { status: 400 })
        if (msg.includes('MIN_AMOUNT:')) {
          const min = msg.split('MIN_AMOUNT:')[1]?.trim()
          return NextResponse.json({ error: `الحد الأدنى لاستخدام الكود ${min}` }, { status: 400 })
        }
        return NextResponse.json({ error: 'كود الخصم غير صحيح' }, { status: 400 })
      }

      if (!couponData) return NextResponse.json({ error: 'كود الخصم غير صحيح' }, { status: 400 })

      const coupon = couponData as { code: string; discount: number }
      discount = coupon.discount
      appliedCouponCode = coupon.code
    }

    // ── Re-validate shipping server-side ──
    const { data: zones } = await supabaseAdmin
      .from('shipping_zones')
      .select('id,name_ar,name_en,countries,base_rate,free_shipping_threshold,estimated_days_min,estimated_days_max,is_active')
      .eq('is_active', true)

    const resolvedCountry = (country_code || 'KW') as GulfCountry
    const shippingResult = calculateShipping(resolvedCountry, subtotal, (zones || []) as unknown as ShippingZone[])
    const shippingCost = shippingResult.rate

    const total = Math.max(0, subtotal - discount + shippingCost)

    // Build order payload for atomic RPC
    const orderData: Record<string, unknown> = {
      id: crypto.randomUUID(),
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
      shipping_cost: shippingCost,
      total,
      coupon_code: appliedCouponCode,
      coupon_discount: discount,
      status: 'pending',
      payment_method,
      payment_status: 'unpaid',
    }
    if (user_id) orderData.user_id = user_id

    const itemsPayload = items.map((item) => {
      const product = productMap.get(item.id)!
      return {
        product_id: item.id,
        product_name_ar: product.name_ar,
        product_name_en: product.name_en,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: product.price * item.quantity,
      }
    })

    // Atomically create order + items + decrement stock via DB transaction
    const { data: orderJson, error: rpcError } = await supabaseAdmin.rpc('create_order_atomic', {
      p_order: orderData,
      p_items: itemsPayload,
    })

    if (rpcError || !orderJson)
      return NextResponse.json({ error: rpcError?.message || 'فشل في إنشاء الطلب' }, { status: 500 })

    const order = orderJson as Record<string, unknown>

    // Increment coupon usage
    if (appliedCouponCode && discount > 0) {
      await supabaseAdmin.rpc('increment_coupon_usage', { coupon_code: appliedCouponCode })
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
