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
    const limit = parseInt(searchParams.get('limit') || '10')
    const filter = searchParams.get('filter') || 'all'

    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filter
    if (filter === 'active') {
      query = query.in('status', ['pending', 'confirmed', 'preparing', 'shipped'])
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

    // Format orders
    const formattedOrders = orders?.map(order => ({
      id: order.id,
      order_number: order.order_number,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
      item_count: order.order_items?.length || 0,
      items: order.order_items?.map((item: any) => ({
        name: item.product_name_ar,
        image: null,
        quantity: item.quantity,
        price: item.unit_price
      }))
    }))

    return NextResponse.json({ orders: formattedOrders })
  } catch (error: any) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
