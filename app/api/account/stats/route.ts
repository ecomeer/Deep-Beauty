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

    // Get total orders
    const { count: totalOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('customer_email', user.email)

    if (ordersError) {
      console.error('Orders count error:', ordersError)
    }

    // Get total spent
    const { data: orders, error: spentError } = await supabase
      .from('orders')
      .select('total')
      .eq('customer_email', user.email)
      .eq('status', 'delivered')

    if (spentError) {
      console.error('Spent calculation error:', spentError)
    }

    const totalSpent = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

    // Get wishlist count
    const { count: wishlistCount, error: wishlistError } = await supabase
      .from('wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (wishlistError) {
      console.error('Wishlist count error:', wishlistError)
    }

    return NextResponse.json({
      totalOrders: totalOrders || 0,
      totalSpent: totalSpent.toFixed(3),
      wishlistCount: wishlistCount || 0
    })
  } catch (error: any) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
