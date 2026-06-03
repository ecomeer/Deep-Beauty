import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
      .select('*, order_items(*)')
      .eq('id', id)
      .eq('order_number', orderNumber)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json({ order: data })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  )
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
