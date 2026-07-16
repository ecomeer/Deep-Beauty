import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildReorderCart } from '@/lib/order-presentation'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  const { id } = await params

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, customer_email, order_items(product_id, product_name_ar, quantity)')
    .eq('id', id)
    .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
    .maybeSingle()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const productIds = Array.from(new Set((order.order_items ?? []).map((item) => item.product_id).filter(Boolean)))
  if (productIds.length === 0) return NextResponse.json(buildReorderCart(order.order_items, []))

  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, name_ar, name_en, slug, price, images, stock_quantity, is_active')
    .in('id', productIds)
  if (error) return NextResponse.json({ error: 'Failed to validate products' }, { status: 500 })

  return NextResponse.json(buildReorderCart(order.order_items, products ?? []))
}
