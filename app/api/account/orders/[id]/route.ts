import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getOrderItemImage, getOrderItemQuantityTotal } from '@/lib/order-presentation'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { id } = await params

  const { data: order, error } = await supabaseAdmin.from('orders').select(`
    id, order_number, customer_name, customer_phone, customer_email, address_line1,
    address_area, address_block, address_street, address_house, notes,
    subtotal, shipping_cost, coupon_discount, coupon_code, total,
    status, payment_method, payment_status, loyalty_points_earned, loyalty_points_redeemed,
    created_at, updated_at, paid_at, confirmed_at, processing_at, shipped_at, delivered_at, cancelled_at, refunded_at,
    order_items (id, product_id, product_name_ar, product_name_en, quantity, unit_price, total_price, product_image_url, product_slug, product_sku, variant_name),
    order_tracking (id, status, status_label_ar, description_ar, location, created_at, is_customer_visible)
  `).eq('id', id).or(`user_id.eq.${user.id},customer_email.eq.${user.email}`).maybeSingle()

  if (error) return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const rawItems = order.order_items ?? []
  const missingSnapshotProductIds = Array.from(new Set(
    rawItems
      .filter((item) => !item.product_image_url && item.product_id)
      .map((item) => item.product_id as string)
  ))
  let currentImageByProductId = new Map<string, string | null>()
  if (missingSnapshotProductIds.length > 0) {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, images')
      .in('id', missingSnapshotProductIds)
    currentImageByProductId = new Map((products ?? []).map((product) => [product.id, product.images?.[0] ?? null]))
  }

  const items = rawItems.map((item) => ({
    ...item,
    image: getOrderItemImage(item.product_image_url, item.product_id ? currentImageByProductId.get(item.product_id) : null),
    line_total: item.total_price,
  }))
  const tracking = (order.order_tracking ?? [])
    .filter((event) => event.is_customer_visible !== false)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return NextResponse.json({ order: { ...order, items, tracking, item_count: getOrderItemQuantityTotal(items) } })
}
