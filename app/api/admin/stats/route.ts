import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, 1y

    const supabase = supabaseAdmin
    
    // Calculate date range
    const now = new Date()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    // Get order IDs for the period first (order_items has no created_at)
    const { data: periodOrders } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'delivered')

    const orderIds = (periodOrders || []).map(o => o.id)
    const safeIds = orderIds.length ? orderIds : ['00000000-0000-0000-0000-000000000000']

    // Get top selling products via those order IDs
    const { data: topProducts } = await supabase
      .from('order_items')
      .select(`
        product_id,
        products:product_id (name_ar, images),
        quantity,
        unit_price
      `)
      .in('order_id', safeIds)
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
    const reviews = reviewsStats ?? []
    const pendingReviews = reviews.filter(r => !r.is_approved).length
    const approvedReviews = reviews.filter(r => r.is_approved).length
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0
    const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: reviews.filter(r => r.rating === star).length,
    }))

    return NextResponse.json({
      topProducts: topProducts || [],
      dailySales: dailySales || [],
      topCustomers: topCustomersList,
      reviewsStats: {
        total: reviews.length,
        pending: pendingReviews,
        approved: approvedReviews,
        averageRating: Number(avgRating.toFixed(1)),
        ratingDistribution,
      },
      period
    })
  } catch (error: any) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
