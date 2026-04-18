import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      { count: totalOrders },
      { count: todayOrders },
      { count: pendingOrders },
      { data: salesData },
      { count: activeProducts },
      { data: recentOrders },
      { data: lowStock },
      { data: chartData },
    ] = await Promise.all([
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('orders').select('total').eq('payment_status', 'paid'),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }).limit(8),
      supabaseAdmin.from('products').select('id, name_ar, stock_quantity').lt('stock_quantity', 10).eq('is_active', true).order('stock_quantity', { ascending: true }).limit(5),
      supabaseAdmin.from('orders').select('created_at, total').gte('created_at', sevenDaysAgo.toISOString()),
    ])

    const totalSales = salesData?.reduce((s, o) => s + Number(o.total), 0) ?? 0

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
      chartData: chartData ?? [],
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
