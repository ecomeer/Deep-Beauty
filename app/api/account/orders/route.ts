import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { ACTIVE_ORDER_STATUSES } from '@/lib/order-status'

interface OrderItemRow {
  product_id: string | null
  product_name_ar: string | null
  product_name_en: string | null
  quantity: number
  unit_price: number
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await requireUser()
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '20', 10)
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20
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
      query = query.in('status', ACTIVE_ORDER_STATUSES)
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

    const productIds = Array.from(new Set(
      (orders ?? []).flatMap((order) =>
        ((order.order_items as OrderItemRow[] | null) ?? [])
          .map((item) => item.product_id)
          .filter((id): id is string => Boolean(id))
      )
    ))
    const { data: products } = productIds.length
      ? await supabase.from('products').select('id, images, slug').in('id', productIds)
      : { data: [] }
    const productDetails = new Map(
      (products ?? []).map((product) => [
        product.id,
        { image: product.images?.[0] || null, slug: product.slug || null },
      ])
    )

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
      item_count: (order.order_items as OrderItemRow[] | null)?.length ?? 0,
      items: ((order.order_items as OrderItemRow[] | null) ?? []).map((item) => ({
        name: item.product_name_ar,
        name_en: item.product_name_en,
        image: item.product_id ? productDetails.get(item.product_id)?.image || null : null,
        slug: item.product_id ? productDetails.get(item.product_id)?.slug || null : null,
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
