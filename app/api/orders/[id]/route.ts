import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const orderNumber = req.nextUrl.searchParams.get('num')

  // FIXED: guest access requires id+order_number; authenticated users can fetch only own order.
  if (orderNumber) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        subtotal,
        shipping_cost,
        coupon_discount,
        total,
        status,
        address_area,
        payment_method,
        payment_status,
        created_at,
        order_items (
          id,
          product_name_ar,
          product_name_en,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', id)
      .eq('order_number', orderNumber)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json({ order: data })
  }

  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_number,
      subtotal,
      shipping_cost,
      coupon_discount,
      total,
      status,
      payment_method,
      payment_status,
      order_items (
        id,
        product_name_ar,
        quantity,
        unit_price,
        total_price
      )
    `)
    .eq('id', id)
    .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Logged-in users can only see their own orders
  if (user) {
    const { data: orderOwner } = await supabaseAdmin
      .from('orders')
      .select('user_id')
      .eq('id', id)
      .single()
    if (orderOwner?.user_id && orderOwner.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.json({ order: data })
}
