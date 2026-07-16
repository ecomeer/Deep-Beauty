import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { getKuwaitDayBounds, getKuwaitIsoDateKey } from '@/lib/kuwait-time'
import {
  isRecognizedRevenueOrder,
  sumRecognizedRevenue,
} from '@/lib/order-reporting'

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr

  try {
    const todayKey = getKuwaitIsoDateKey()
    const { start: todayStart, end: todayEnd } = getKuwaitDayBounds(todayKey)
    const sevenDaysAgoKey = getKuwaitIsoDateKey(
      new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    )
    const { start: sevenDaysStart } = getKuwaitDayBounds(sevenDaysAgoKey)

    const [
      { count: totalOrders },
      { count: todayOrders },
      { count: pendingOrders },
      { data: revenueOrders },
      { count: activeProducts },
      { data: recentOrders },
      { data: lowStock },
      { data: chartOrders },
    ] = await Promise.all([
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd),
      supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabaseAdmin
        .from('orders')
        .select('total,status,payment_status,payment_method')
        .or('payment_status.eq.paid,and(payment_method.eq.cod,status.eq.delivered)'),
      supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabaseAdmin
        .from('orders')
        .select('id,order_number,customer_name,total,status,payment_method,created_at')
        .order('created_at', { ascending: false })
        .limit(8),
      supabaseAdmin
        .from('products')
        .select('id, name_ar, stock_quantity')
        .lt('stock_quantity', 10)
        .eq('is_active', true)
        .order('stock_quantity', { ascending: true })
        .limit(5),
      supabaseAdmin
        .from('orders')
        .select('created_at,total,status,payment_status,payment_method')
        .gte('created_at', sevenDaysStart),
    ])

    const totalSales = sumRecognizedRevenue(revenueOrders)
    const chartData = (chartOrders ?? []).map((order) => ({
      created_at: order.created_at,
      total: isRecognizedRevenueOrder(order) ? Number(order.total) : 0,
    }))

    return NextResponse.json({
      stats: {
        totalOrders: totalOrders ?? 0,
        todayOrders: todayOrders ?? 0,
        pendingOrders: pendingOrders ?? 0,
        totalSales,
        activeProducts: activeProducts ?? 0,
      },
      recentOrders: recentOrders ?? [],
      lowStock: lowStock ?? [],
      chartData,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
