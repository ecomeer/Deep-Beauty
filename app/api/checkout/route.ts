import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendAdminPushNotification } from '@/lib/push-notifications'

type CheckoutItemInput = {
  id: string
  quantity: number
}

const MAX_SHIPPING_COST = 100

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
      shipping_cost,
      coupon_code,
      payment_method,
      user_id,
      items,
    } = body

    if (!orderNumber || !customer_name || !customer_phone || !payment_method) {
      return NextResponse.json({ error: 'بيانات الطلب الأساسية ناقصة' }, { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'السلة فارغة' }, { status: 400 })
    }

    const normalizedItems = items
      .map((item: CheckoutItemInput) => ({
        id: String(item.id || ''),
        quantity: Number(item.quantity || 0),
      }))
      .filter((item: CheckoutItemInput) => item.id && Number.isFinite(item.quantity) && item.quantity > 0)

    if (normalizedItems.length !== items.length) {
      return NextResponse.json({ error: 'بيانات المنتجات غير صالحة' }, { status: 400 })
    }

    const productIds = [...new Set(normalizedItems.map((item: CheckoutItemInput) => item.id))]
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name_ar, name_en, price, stock_quantity')
      .in('id', productIds)
      .eq('is_active', true)

    if (productsError || !products) {
      return NextResponse.json({ error: 'تعذر التحقق من المنتجات' }, { status: 500 })
    }

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'بعض المنتجات غير متاحة' }, { status: 400 })
    }

    const productMap = new Map(products.map((product) => [product.id, product]))

    let calculatedSubtotal = 0
    for (const item of normalizedItems) {
      const product = productMap.get(item.id)
      if (!product) {
        return NextResponse.json({ error: 'منتج غير موجود' }, { status: 400 })
      }
      if ((product.stock_quantity ?? 0) < item.quantity) {
        return NextResponse.json({ error: `الكمية غير متوفرة للمنتج: ${product.name_ar}` }, { status: 400 })
      }
      calculatedSubtotal += Number(product.price) * item.quantity
    }

    let calculatedCouponDiscount = 0
    const normalizedCoupon = coupon_code ? String(coupon_code).trim().toUpperCase() : null
    if (normalizedCoupon) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', normalizedCoupon)
        .eq('is_active', true)
        .maybeSingle()

      if (coupon) {
        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date()
        const isUsageLimitReached = coupon.usage_limit && coupon.usage_count >= coupon.usage_limit
        const minOrderAmount = Number(coupon.min_order_amount || 0)

        if (!isExpired && !isUsageLimitReached && calculatedSubtotal >= minOrderAmount) {
          calculatedCouponDiscount = coupon.type === 'percentage'
            ? Math.min(
                (calculatedSubtotal * Number(coupon.value || 0)) / 100,
                coupon.max_discount_amount ?? Infinity
              )
            : Math.min(Number(coupon.value || 0), calculatedSubtotal)
        }
      }
    }

    const normalizedShippingCostRaw = Number(shipping_cost)
    const normalizedShippingCost =
      Number.isFinite(normalizedShippingCostRaw) && normalizedShippingCostRaw >= 0
        ? Math.min(normalizedShippingCostRaw, MAX_SHIPPING_COST)
        : 0

    const calculatedTotal = Math.max(0, calculatedSubtotal - calculatedCouponDiscount + normalizedShippingCost)

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
      subtotal: calculatedSubtotal,
      shipping_cost: normalizedShippingCost,
      total: calculatedTotal,
      coupon_code: normalizedCoupon,
      coupon_discount: calculatedCouponDiscount,
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
      normalizedItems.map((item: CheckoutItemInput) => {
        const product = productMap.get(item.id)!
        return {
          order_id: order.id,
          product_id: item.id,
          product_name_ar: product.name_ar,
          product_name_en: product.name_en,
          quantity: item.quantity,
          unit_price: Number(product.price),
          total_price: Number(product.price) * item.quantity,
        }
      })
    )

    // Decrement stock for each item
    await Promise.all(
      normalizedItems.map((item: CheckoutItemInput) =>
        supabaseAdmin.rpc('decrement_stock', { product_id: item.id, qty: item.quantity })
      )
    )

    // Increment coupon usage
    if (normalizedCoupon && calculatedCouponDiscount > 0) {
      await supabaseAdmin.rpc('increment_coupon_usage', { coupon_code: normalizedCoupon })
    }

    // Send push notification (fire and forget)
    try {
      await sendAdminPushNotification({
        title: 'طلب جديد! 🛍️',
        body: `طلب #${order.order_number} من ${customer_name} - ${payment_method === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'}`,
        url: `/admin/orders/${order.id}`,
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
