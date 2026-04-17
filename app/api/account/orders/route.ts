import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const filter = searchParams.get('filter') || 'all'

    // Primary: match by user_id (set after migration), fallback: match by email
    let query = supabase
      .from('orders')
      .select(`
        id, order_number, total, subtotal, shipping_cost, coupon_discount,
        status, payment_method, payment_status, created_at,
        order_items (
          id, product_id, product_name_ar, product_name_en,
          quantity, unit_price, total_price
        )
      `)
      .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filter
    if (filter === 'active') {
      query = query.in('status', ['pending', 'confirmed', 'processing', 'shipped'])
    } else if (filter === 'completed') {
      query = query.eq('status', 'delivered')
    } else if (filter === 'cancelled') {
      query = query.eq('status', 'cancelled')
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Orders fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // Format orders for frontend
    const formattedOrders = (orders ?? []).map(order => ({
      id: order.id,
      order_number: order.order_number,
      total: order.total,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      coupon_discount: order.coupon_discount,
      status: order.status,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      created_at: order.created_at,
      item_count: (order.order_items as any[])?.length ?? 0,
      items: ((order.order_items as any[]) ?? []).map((item) => ({
        name: item.product_name_ar,
        name_en: item.product_name_en,
        image: null,           // no image stored in order_items; fetch from product if needed
        quantity: item.quantity,
        price: item.unit_price,
      })),
    }))

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
