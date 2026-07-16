import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { getKuwaitDayBounds, getKuwaitIsoDateKey } from '@/lib/kuwait-time'
import { filterRecognizedRevenueOrders } from '@/lib/order-reporting'

interface StatsCustomer {
  name: string
  phone: string
  totalSpent: number
  ordersCount: number
}

interface TopCustomerOrder {
  customer_name: string
  customer_phone: string
  total: number
}

export async function GET(request: NextRequest) {
  const _authErr = await requireAdmin(request)
  if (_authErr) return _authErr

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
    const startKey = getKuwaitIsoDateKey(
      new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
    )
    const { start: startDate } = getKuwaitDayBounds(startKey)

    // Fetch only orders that can potentially count as recognized revenue,
    // then apply the central rule in code so dashboard and statistics agree.
    const { data: periodOrders } = await supabaseAdmin
      .from('orders')
      .select(
        'id, created_at, total, status, payment_status, payment_method, customer_name, customer_phone'
      )
      .gte('created_at', startDate)
      .or('payment_status.eq.paid,and(payment_method.eq.cod,status.eq.delivered)')
      .order('created_at', { ascending: true })

    const orders = filterRecognizedRevenueOrders(periodOrders)
    const orderIds = orders.map((order) => order.id)
    const safeIds = orderIds.length
      ? orderIds
      : ['00000000-0000-0000-0000-000000000000']

    const [{ data: topProducts }, { data: reviewsStats }] = await Promise.all([
      supabaseAdmin
        .from('order_items')
        .select(`
          product_id,
          products:product_id (name_ar, images),
          quantity,
          unit_price
        `)
        .in('order_id', safeIds)
        .order('quantity', { ascending: false })
        .limit(10),
      supabaseAdmin.from('reviews').select('is_approved, rating'),
    ])

    const dailySales = orders.map(({ created_at, total, status }) => ({
      created_at,
      total,
      status,
    }))

    const customersMap = new Map<string, StatsCustomer>()
    ;(orders as TopCustomerOrder[]).forEach((order) => {
      const key = order.customer_phone
      const existing = customersMap.get(key) || {
        name: order.customer_name,
        phone: order.customer_phone,
        totalSpent: 0,
        ordersCount: 0,
      }
      existing.totalSpent += Number(order.total)
      existing.ordersCount += 1
      customersMap.set(key, existing)
    })

    const topCustomersList = Array.from(customersMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    const reviews = reviewsStats ?? []
    const pendingReviews = reviews.filter((review) => !review.is_approved).length
    const approvedReviews = reviews.filter((review) => review.is_approved).length
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0
    const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((review) => review.rating === star).length,
    }))

    return NextResponse.json({
      topProducts: topProducts || [],
      dailySales,
      topCustomers: topCustomersList,
      reviewsStats: {
        total: reviews.length,
        pending: pendingReviews,
        approved: approvedReviews,
        averageRating: Number(avgRating.toFixed(1)),
        ratingDistribution,
      },
      period,
    })
  } catch (error: unknown) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Stats fetch failed' },
      { status: 500 }
    )
  }
}
