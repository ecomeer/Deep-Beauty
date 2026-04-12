'use client'

import { useState, useEffect } from 'react'
import { toArabicPrice, STATUS_COLORS, STATUS_LABELS, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import {
  ShoppingBagIcon, CurrencyDollarIcon, InboxStackIcon, TagIcon,
  ExclamationCircleIcon, ExclamationTriangleIcon, StarIcon,
  ChartBarIcon, UsersIcon
} from '@heroicons/react/24/outline'

interface DayData { label: string; count: number; revenue: number }

function BarChart({ days, valueKey }: { days: DayData[]; valueKey: 'count' | 'revenue' }) {
  const max = Math.max(...days.map(d => d[valueKey])) || 1
  return (
    <div className="flex items-end gap-1.5 h-20 mt-3">
      {days.map(day => {
        const pct = (day[valueKey] / max) * 100
        return (
          <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md transition-all"
              style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: 'var(--primary)', opacity: 0.75 }}
            />
            <span className="text-xs opacity-50" style={{ fontSize: '0.6rem' }}>{day.label}</span>
          </div>
        )
      })}
    </div>
  )
}

interface DashboardData {
  stats: { totalOrders: number; todayOrders: number; totalSales: number; activeProducts: number; pendingOrders: number }
  recentOrders: any[]
  lowStock: any[]
  chartData: { created_at: string; total: number }[]
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [chartDays, setChartDays] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then((json: DashboardData) => {
        setData(json)

        // Build 7-day chart from raw order data
        const days: DayData[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          const label = d.toLocaleDateString('ar-KW', { weekday: 'short' })
          const dateStr = d.toISOString().slice(0, 10)
          const dayOrders = (json.chartData || []).filter(o => o.created_at.slice(0, 10) === dateStr)
          days.push({
            label,
            count: dayOrders.length,
            revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0),
          })
        }
        setChartDays(days)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!data) return (
    <div className="flex h-64 items-center justify-center text-red-500">
      فشل تحميل البيانات
    </div>
  )

  const { stats, recentOrders, lowStock } = data

  const statCards = [
    { title: 'إجمالي الطلبات', value: stats.totalOrders, icon: InboxStackIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'طلبات اليوم', value: stats.todayOrders, icon: TagIcon, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'إجمالي المبيعات', value: toArabicPrice(stats.totalSales), icon: CurrencyDollarIcon, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'المنتجات النشطة', value: stats.activeProducts, icon: ShoppingBagIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'قيد الانتظار', value: stats.pendingOrders, icon: ExclamationCircleIcon, color: 'text-red-500', bg: 'bg-red-50' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>نظرة عامة</h1>
        <p className="text-sm opacity-60">مرحباً بك في لوحة تحكم ديب بيوتي</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((s, i) => (
          <div key={i} className="stats-card flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs opacity-60 mb-0.5">{s.title}</p>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/admin/reviews" className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <StarIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="font-bold text-gray-800">التقييمات</p>
            <p className="text-sm text-gray-500">إدارة تقييمات العملاء</p>
          </div>
        </Link>
        <Link href="/admin/stats" className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-gray-800">إحصائيات متقدمة</p>
            <p className="text-sm text-gray-500">تحليل المبيعات والعملاء</p>
          </div>
        </Link>
        <Link href="/admin/customers" className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <UsersIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-bold text-gray-800">العملاء</p>
            <p className="text-sm text-gray-500">قائمة العملاء والمشتريات</p>
          </div>
        </Link>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="rounded-2xl p-4 mb-8 border-2 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
            <p className="text-sm font-bold text-orange-700">تنبيه: منتجات تحتاج تجديد المخزون</p>
          </div>
          <div className="space-y-2">
            {lowStock.map((p: any) => (
              <Link key={p.id} href={`/admin/products/${p.id}`}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-sm font-medium">{p.name_ar}</span>
                <span className={`badge ${p.stock_quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                  {p.stock_quantity === 0 ? 'نفذ المخزون' : `${p.stock_quantity} متبقي`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--beige)' }}>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-dark)' }}>الطلبات — آخر ٧ أيام</p>
          <p className="text-2xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--primary)' }}>
            {chartDays.reduce((s, d) => s + d.count, 0)}
          </p>
          <BarChart days={chartDays} valueKey="count" />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--beige)' }}>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-dark)' }}>الإيرادات — آخر ٧ أيام</p>
          <p className="text-2xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--primary)' }}>
            {toArabicPrice(chartDays.reduce((s, d) => s + d.revenue, 0))}
          </p>
          <BarChart days={chartDays} valueKey="revenue" />
        </div>
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
                <th>عرض</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 opacity-50">لا توجد طلبات بعد</td></tr>
              ) : (
                recentOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="font-en font-bold text-xs">{order.order_number}</td>
                    <td className="font-medium">{order.customer_name}</td>
                    <td className="font-bold" style={{ color: 'var(--primary)' }}>{toArabicPrice(order.total)}</td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[order.status] || 'badge-gray'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="text-xs" dir="ltr">{formatDateTime(order.created_at)}</td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium hover:underline" style={{ color: 'var(--primary)' }}>
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
