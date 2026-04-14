'use client'

import { useState, useEffect } from 'react'
import { toArabicPrice, STATUS_COLORS, STATUS_LABELS, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import {
  ShoppingBagIcon, CurrencyDollarIcon, InboxStackIcon, TagIcon,
  ExclamationCircleIcon, ExclamationTriangleIcon, StarIcon,
  ChartBarIcon, UsersIcon, ArrowTrendingUpIcon, ClockIcon,
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

  const today = new Date().toLocaleDateString('ar-KW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const statCards = [
    { title: 'إجمالي الطلبات', value: stats.totalOrders, icon: InboxStackIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { title: 'طلبات اليوم', value: stats.todayOrders, icon: TagIcon, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { title: 'إجمالي المبيعات', value: toArabicPrice(stats.totalSales), icon: CurrencyDollarIcon, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    { title: 'المنتجات النشطة', value: stats.activeProducts, icon: ShoppingBagIcon, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { title: 'قيد الانتظار', value: stats.pendingOrders, icon: ExclamationCircleIcon, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', href: '/admin/orders?status=pending' },
  ]

  const quickLinks = [
    { href: '/admin/orders', icon: InboxStackIcon, bg: 'bg-blue-100', color: 'text-blue-600', label: 'الطلبات', sub: 'إدارة طلبات العملاء' },
    { href: '/admin/products', icon: ShoppingBagIcon, bg: 'bg-purple-100', color: 'text-purple-600', label: 'المنتجات', sub: 'إضافة وتعديل المنتجات' },
    { href: '/admin/customers', icon: UsersIcon, bg: 'bg-green-100', color: 'text-green-600', label: 'العملاء', sub: 'قائمة العملاء والمشتريات' },
    { href: '/admin/reviews', icon: StarIcon, bg: 'bg-yellow-100', color: 'text-yellow-600', label: 'التقييمات', sub: 'إدارة تقييمات العملاء' },
    { href: '/admin/coupons', icon: TagIcon, bg: 'bg-pink-100', color: 'text-pink-600', label: 'الكوبونات', sub: 'إنشاء وإدارة العروض' },
    { href: '/admin/stats', icon: ChartBarIcon, bg: 'bg-indigo-100', color: 'text-indigo-600', label: 'إحصائيات متقدمة', sub: 'تحليل المبيعات والأداء' },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>نظرة عامة</h1>
          <p className="text-sm opacity-50 mt-0.5">{today}</p>
        </div>
        {stats.pendingOrders > 0 && (
          <Link
            href="/admin/orders?status=pending"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold shadow hover:bg-red-600 transition-colors self-start sm:self-auto"
          >
            <ClockIcon className="w-4 h-4" />
            {stats.pendingOrders} طلب بانتظار المعالجة
          </Link>
        )}
      </div>

      {/* ── Low Stock Alert ── */}
      {lowStock.length > 0 && (
        <div className="rounded-2xl p-4 border-2 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
            <p className="text-sm font-bold text-orange-700">
              تنبيه: {lowStock.length} منتج {lowStock.length === 1 ? 'يحتاج' : 'يحتاجون'} تجديد المخزون
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {lowStock.map((p: any) => (
              <Link key={p.id} href={`/admin/products/${p.id}`}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-sm font-medium truncate">{p.name_ar}</span>
                <span className={`badge flex-shrink-0 ml-2 ${p.stock_quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                  {p.stock_quantity === 0 ? 'نفذ' : `${p.stock_quantity} متبقي`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((s, i) => {
          const inner = (
            <div key={i} className={`stats-card flex items-center gap-3 border ${s.border} hover:shadow-md transition-shadow`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs opacity-60 mb-0.5 truncate">{s.title}</p>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>{s.value}</h3>
              </div>
            </div>
          )
          return s.href ? <Link href={s.href} key={i}>{inner}</Link> : inner
        })}
      </div>

      {/* ── Charts + Quick Links ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Charts — 2/3 width */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: 'var(--beige)' }}>
            <div className="flex items-center gap-2 mb-1">
              <ArrowTrendingUpIcon className="w-4 h-4 opacity-40" />
              <p className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>الطلبات — آخر ٧ أيام</p>
            </div>
            <p className="text-2xl font-bold" dir="ltr" style={{ color: 'var(--primary)' }}>
              {chartDays.reduce((s, d) => s + d.count, 0)}
            </p>
            <BarChart days={chartDays} valueKey="count" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: 'var(--beige)' }}>
            <div className="flex items-center gap-2 mb-1">
              <CurrencyDollarIcon className="w-4 h-4 opacity-40" />
              <p className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>الإيرادات — آخر ٧ أيام</p>
            </div>
            <p className="text-2xl font-bold" dir="ltr" style={{ color: 'var(--primary)' }}>
              {toArabicPrice(chartDays.reduce((s, d) => s + d.revenue, 0))}
            </p>
            <BarChart days={chartDays} valueKey="revenue" />
          </div>
        </div>

        {/* Quick Links — 1/3 width */}
        <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: 'var(--beige)' }}>
          <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-dark)' }}>روابط سريعة</p>
          <div className="space-y-2">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${link.bg}`}>
                  <link.icon className={`w-4 h-4 ${link.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 group-hover:text-gray-900">{link.label}</p>
                  <p className="text-xs text-gray-400 truncate">{link.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>أحدث الطلبات</h2>
          <Link href="/admin/orders" className="text-sm font-medium hover:underline" style={{ color: 'var(--primary)' }}>
            عرض الكل
          </Link>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
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

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-3">
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 opacity-50">لا توجد طلبات بعد</div>
          ) : (
            recentOrders.map((order: any) => (
              <div key={order.id} className="border rounded-xl p-4" style={{ borderColor: 'var(--beige)' }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-en font-bold text-xs">#{order.order_number}</span>
                    <p className="font-medium text-sm">{order.customer_name}</p>
                  </div>
                  <span className={`badge ${STATUS_COLORS[order.status] || 'badge-gray'} text-xs`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: 'var(--primary)' }}>{toArabicPrice(order.total)}</span>
                  <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                    تفاصيل
                  </Link>
                </div>
                <p className="text-xs opacity-50 mt-2" dir="ltr">{formatDateTime(order.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
