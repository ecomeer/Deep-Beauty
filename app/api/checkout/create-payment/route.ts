import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ─── POST /api/checkout/create-payment ────────────────────────────
// Creates a Tap charge and returns the payment URL.
// Requires TAP_SECRET_KEY env variable.
//
// Body: {
//   cart: { items: CartItem[] }
//   shipping_address: ShippingAddress
//   coupon_code?: string
//   total: number          ← client-calculated, we re-validate server side
// }

interface CartItem {
  id: string
  name_ar: string
  price: number
  quantity: number
}

interface ShippingAddress {
  full_name: string
  phone: string
  governorate: string
  area: string
  block: string
  street: string
  building: string
  apartment?: string
}

export async function POST(req: NextRequest) {
  // ── Guard: no API key yet ──
  if (!process.env.TAP_SECRET_KEY) {
    return NextResponse.json(
      {
        error: 'Tap Payment غير مفعل بعد',
        ar: 'خدمة الدفع الإلكتروني غير متاحة حالياً، يرجى الدفع عند الاستلام أو التواصل معنا.',
      },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const { cart, shipping_address, coupon_code } = body as {
      cart: { items: CartItem[] }
      shipping_address: ShippingAddress
      coupon_code?: string
    }

    if (!cart?.items?.length || !shipping_address) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    // ── Re-validate prices server-side (never trust client totals) ──
    const productIds = cart.items.map((i) => i.id)
    const { data: dbProducts, error: dbErr } = await supabaseAdmin
      .from('products')
      .select('id, price, stock_quantity')
      .in('id', productIds)
      .eq('is_active', true)

    if (dbErr || !dbProducts) {
      return NextResponse.json({ error: 'فشل في التحقق من المنتجات' }, { status: 500 })
    }

    const priceMap = new Map(dbProducts.map((p) => [p.id, p.price]))
    let subtotal = 0
    for (const item of cart.items) {
      const dbPrice = priceMap.get(item.id)
      if (!dbPrice) {
        return NextResponse.json({ error: `منتج غير موجود: ${item.name_ar}` }, { status: 400 })
      }
      subtotal += dbPrice * item.quantity
    }

    // ── Apply coupon if provided ──
    let discount = 0
    if (coupon_code) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle()

      if (coupon) {
        const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date()
        const maxed  = coupon.usage_limit && coupon.usage_count >= coupon.usage_limit
        if (!expired && !maxed && subtotal >= coupon.min_order_amount) {
          discount = coupon.type === 'percentage'
            ? Math.min((subtotal * coupon.value) / 100, coupon.max_discount_amount ?? Infinity)
            : Math.min(coupon.value, subtotal)
        }
      }
    }

    const SHIPPING_COST = 1.5 // KWD — adjust to match your shipping logic
    const total = Math.max(0, subtotal - discount + SHIPPING_COST)

    const orderRef = 'DB-' + Date.now().toString().slice(-6)
    const phone = shipping_address.phone.replace(/^\+965/, '').replace(/\s/g, '')

    // ── Call Tap API ──
    const tapRes = await fetch('https://api.tap.company/v2/charges', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TAP_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: parseFloat(total.toFixed(3)),
        currency: 'KWD',
        customer_initiated: true,
        threeDSecure: true,
        save_card: false,
        description: `Deep Beauty — ${orderRef}`,
        metadata: { order_ref: orderRef, coupon_code: coupon_code ?? '' },
        customer: {
          first_name: shipping_address.full_name.split(' ')[0],
          last_name: shipping_address.full_name.split(' ').slice(1).join(' ') || '-',
          phone: { country_code: '965', number: phone },
        },
        source: { id: 'src_all' },
        redirect: {
          url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/verify`,
        },
        reference: { transaction: orderRef, order: orderRef },
        post: {
          url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/checkout/webhook`,
        },
      }),
    })

    if (!tapRes.ok) {
      const tapErr = await tapRes.json().catch(() => ({}))
      console.error('Tap API error:', tapErr)
      return NextResponse.json(
        { error: 'فشل في إنشاء عملية الدفع' },
        { status: 502 }
      )
    }

    const tapData = await tapRes.json()
    const paymentUrl = tapData?.transaction?.url
    const chargeId  = tapData?.id

    if (!paymentUrl) {
      return NextResponse.json({ error: 'لم يتم الحصول على رابط الدفع' }, { status: 502 })
    }

    return NextResponse.json({
      payment_url: paymentUrl,
      charge_id: chargeId,
      order_ref: orderRef,
      validated_total: total,
    })
  } catch (err) {
    console.error('create-payment exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
