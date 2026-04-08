'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toArabicPrice, STATUS_COLORS, STATUS_LABELS, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { ShoppingBagIcon, CurrencyDollarIcon, InboxStackIcon, TagIcon } from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalSales: 0,
    activeProducts: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      // 1. Total Orders
      const { count: tOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true })
      
      // 2. Today's Orders
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: todayOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // 3. Total Sales
      const { data: salesData } = await supabase
        .from('orders')
        .select('total')
        .eq('payment_status', 'paid')
      const totalSales = salesData?.reduce((sum, order) => sum + Number(order.total), 0) || 0

      // 4. Active Products
      const { count: activeProd } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      setStats({
        totalOrders: tOrders || 0,
        todayOrders: todayOrders || 0,
        totalSales,
        activeProducts: activeProd || 0
      })

      // Recent Orders
      const { data: recOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      setRecentOrders(recOrders || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )

  const statCards = [
    { title: 'إجمالي الطلبات', value: stats.totalOrders, icon: InboxStackIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'طلبات اليوم', value: stats.todayOrders, icon: TagIcon, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'إجمالي المبيعات', value: toArabicPrice(stats.totalSales), icon: CurrencyDollarIcon, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'المنتجات النشطة', value: stats.activeProducts, icon: ShoppingBagIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>نظرة عامة</h1>
        <p className="text-sm opacity-60">مرحباً بك في لوحة تحكم ديب بيوتي</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((s, i) => (
          <div key={i} className="stats-card flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.bg}`}>
              <s.icon className={`w-7 h-7 ${s.color}`} />
            </div>
            <div>
              <p className="text-sm opacity-60 mb-1">{s.title}</p>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-dark)' }}>أحدث الطلبات</h2>
          <Link href="/admin/orders" className="text-sm font-medium hover:underline" style={{ color: 'var(--primary)' }}>
            عرض الكل
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>عــرض</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 opacity-50">لا توجد طلبات بعد</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-en font-bold text-xs">{order.order_number}</td>
                    <td className="font-medium">{order.customer_name}</td>
                    <td className="font-bold text-[#9C6644]">{toArabicPrice(order.total)}</td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[order.status] || 'badge-gray'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="text-xs" dir="ltr">{formatDateTime(order.created_at)}</td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="text-[#9C6644] hover:underline text-sm font-medium">
                        تفاصيل
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
