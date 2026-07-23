import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

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
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, 1y

    const supabase = supabaseAdmin
    
    // Calculate date range
    const now = new Date()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    // One query over the period's delivered orders; order IDs, daily sales,
    // and top customers are all derived from it.
    const { data: periodOrders } = await supabase
      .from('orders')
      .select('id, created_at, total, status, customer_name, customer_phone')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'delivered')
      .order('created_at', { ascending: true })

    const orders = periodOrders || []
    const orderIds = orders.map(o => o.id)
    const safeIds = orderIds.length ? orderIds : ['00000000-0000-0000-0000-000000000000']

    const [{ data: periodItems }, { data: reviewsStatsData }] = await Promise.all([
      // All line-items for the period's delivered orders. Aggregated per
      // product below — a raw `.order('quantity').limit(10)` returned the 10
      // biggest single line-items (same product could repeat, totals were
      // per-line), which is not a "top products" ranking.
      supabase
        .from('order_items')
        .select(`
          product_id,
          products:product_id (name_ar, images),
          quantity,
          unit_price
        `)
        .in('order_id', safeIds),
      // Aggregated in SQL — see get_reviews_stats() — instead of pulling
      // every review row into Node to count/average in JS.
      supabase.rpc('get_reviews_stats'),
    ])

    // Aggregate line-items into a real per-product ranking (qty + revenue).
    interface TopProduct {
      product_id: string
      products: { name_ar: string; images: string[] } | null
      quantity: number
      revenue: number
    }
    interface PeriodItem {
      product_id: string
      products: { name_ar: string; images: string[] } | { name_ar: string; images: string[] }[] | null
      quantity: number | string
      unit_price: number | string
    }
    const productsMap = new Map<string, TopProduct>()
    ;(periodItems as PeriodItem[] | null)?.forEach(item => {
      if (!item.product_id) return
      const productRow = Array.isArray(item.products) ? item.products[0] : item.products
      const existing = productsMap.get(item.product_id) || {
        product_id: item.product_id,
        products: productRow ?? null,
        quantity: 0,
        revenue: 0,
      }
      existing.quantity += Number(item.quantity)
      existing.revenue += Number(item.unit_price) * Number(item.quantity)
      productsMap.set(item.product_id, existing)
    })
    const topProducts = Array.from(productsMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    const dailySales = orders.map(({ created_at, total, status }) => ({ created_at, total, status }))
    const topCustomers = orders

    // Calculate stats
    const customersMap = new Map<string, StatsCustomer>()
    ;(topCustomers as TopCustomerOrder[] | null)?.forEach(order => {
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
    
    const reviewsStats = (reviewsStatsData as {
      total: number
      pending: number
      approved: number
      averageRating: number
      ratingDistribution: { star: number; count: number }[]
    } | null) ?? { total: 0, pending: 0, approved: 0, averageRating: 0, ratingDistribution: [] }

    return NextResponse.json({
      topProducts,
      dailySales: dailySales || [],
      topCustomers: topCustomersList,
      // Distinct customers with a delivered order in the period — the real
      // "active customers" figure (the top-customers list is capped at 10).
      activeCustomers: customersMap.size,
      reviewsStats,
      period
    })
  } catch (error: unknown) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Stats fetch failed' },
      { status: 500 }
    )
  }
}
