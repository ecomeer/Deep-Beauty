import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ─── GET /api/checkout/verify?tap_id=xxx ──────────────────────────
// Called after Tap redirects the user back to /checkout/verify
// Verifies the charge with Tap API, then creates the order in DB.
//
// Returns:
//   { success: true, order_id, order_number } — on success
//   { success: false, error }                  — on failure

export async function GET(req: NextRequest) {
  // ── Guard: no API key yet ──
  if (!process.env.TAP_SECRET_KEY) {
    return NextResponse.json(
      { success: false, error: 'Tap غير مفعل' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const tapId = searchParams.get('tap_id')

    if (!tapId) {
      return NextResponse.json({ success: false, error: 'tap_id مطلوب' }, { status: 400 })
    }

    // ── Verify charge with Tap ──
    const tapRes = await fetch(`https://api.tap.company/v2/charges/${tapId}`, {
      headers: { Authorization: `Bearer ${process.env.TAP_SECRET_KEY}` },
    })

    if (!tapRes.ok) {
      return NextResponse.json({ success: false, error: 'فشل التحقق من الدفع' }, { status: 502 })
    }

    const charge = await tapRes.json()

    if (charge.status !== 'CAPTURED') {
      return NextResponse.json(
        {
          success: false,
          error: 'لم يتم إتمام عملية الدفع',
          tap_status: charge.status,
        },
        { status: 402 }
      )
    }

    // ── Check if order already exists for this charge (idempotency) ──
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id, order_number')
      .eq('tap_charge_id', tapId)
      .maybeSingle()

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        order_id: existingOrder.id,
        order_number: existingOrder.order_number,
        already_created: true,
      })
    }

    // ── Extract metadata saved at charge creation ──
    const orderRef  = charge.reference?.transaction ?? ('DB-' + Date.now().toString().slice(-6))
    const amount    = charge.amount ?? 0

    // Note: full order row creation requires the original cart/address.
    // At this point you should either:
    //   (a) Store a pending_orders table populated by create-payment, OR
    //   (b) Pass cart+address via Tap metadata (limited to small payloads).
    //
    // This minimal implementation creates a placeholder "paid" order.
    // Replace with your full order-creation logic when ready.

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderRef,
        status: 'confirmed',
        payment_method: 'tap',
        payment_status: 'paid',
        tap_charge_id: tapId,
        subtotal: amount,
        shipping_cost: 1.5,
        total: amount,
        coupon_discount: 0,
        // Shipping address arrives separately — update when you add pending_orders
        customer_name: charge.customer?.first_name + ' ' + (charge.customer?.last_name ?? ''),
        customer_phone: charge.customer?.phone?.number ?? '',
        address_line1: '',
        address_area: '',
      })
      .select()
      .single()

    if (orderErr || !order) {
      console.error('Order creation after payment error:', orderErr)
      return NextResponse.json(
        { success: false, error: 'تم الدفع لكن فشل إنشاء الطلب — تواصل معنا برقم: ' + tapId },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
    })
  } catch (err) {
    console.error('verify exception:', err)
    return NextResponse.json({ success: false, error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
