import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, 1y
    
    const supabase = await createServerSupabaseClient()
    
    // Calculate date range
    const now = new Date()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    // Get top selling products
    const { data: topProducts, error: topProductsError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        products:product_id (name_ar, images),
        quantity,
        price
      `)
      .gte('created_at', startDate.toISOString())
      .order('quantity', { ascending: false })
      .limit(10)
    
    // Get sales by day
    const { data: dailySales, error: dailySalesError } = await supabase
      .from('orders')
      .select('created_at, total, status')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'delivered')
      .order('created_at', { ascending: true })
    
    // Get top customers
    const { data: topCustomers, error: topCustomersError } = await supabase
      .from('orders')
      .select('customer_name, customer_phone, total')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'delivered')
    
    // Get reviews stats
    const { data: reviewsStats, error: reviewsError } = await supabase
      .from('reviews')
      .select('is_approved, rating')
      
    // Calculate stats
    const customersMap = new Map()
    topCustomers?.forEach(order => {
      const key = order.customer_phone
      const existing = customersMap.get(key) || {
        name: order.customer_name,
        phone: order.customer_phone,
        totalSpent: 0,
        ordersCount: 0
      }
      existing.totalSpent += Number(order.total)
      existing.ordersCount += 1
      customersMap.set(key, existing)
    })
    
    const topCustomersList = Array.from(customersMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
    
    // Reviews stats
    const pendingReviews = reviewsStats?.filter(r => !r.is_approved).length || 0
    const approvedReviews = reviewsStats?.filter(r => r.is_approved).length || 0
    const avgRating = reviewsStats?.length > 0
      ? reviewsStats.reduce((sum, r) => sum + r.rating, 0) / reviewsStats.length
      : 0
    
    return NextResponse.json({
      topProducts: topProducts || [],
      dailySales: dailySales || [],
      topCustomers: topCustomersList,
      reviewsStats: {
        total: reviewsStats?.length || 0,
        pending: pendingReviews,
        approved: approvedReviews,
        averageRating: Number(avgRating.toFixed(1))
      },
      period
    })
  } catch (error: any) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
