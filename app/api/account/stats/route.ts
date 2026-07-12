import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { user, supabase, error: authError } = await requireUser()
    if (authError) return authError

    const [
      { count: totalOrders, error: ordersError },
      { data: orders, error: spentError },
      { count: wishlistCount, error: wishlistError },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_email', user.email),
      supabase
        .from('orders')
        .select('total')
        .eq('customer_email', user.email)
        .eq('status', 'delivered'),
      supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ])

    if (ordersError) {
      console.error('Orders count error:', ordersError)
    }
    if (spentError) {
      console.error('Spent calculation error:', spentError)
    }
    if (wishlistError) {
      console.error('Wishlist count error:', wishlistError)
    }

    const totalSpent = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

    return NextResponse.json({
      totalOrders: totalOrders || 0,
      totalSpent: totalSpent.toFixed(3),
      wishlistCount: wishlistCount || 0
    })
  } catch (error: unknown) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
