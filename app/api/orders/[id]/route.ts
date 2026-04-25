import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Public endpoint — order UUID is unguessable (128-bit), used by order-success page
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  return NextResponse.json({ order: data })
}
