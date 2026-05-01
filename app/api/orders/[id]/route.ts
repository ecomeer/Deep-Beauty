import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

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
