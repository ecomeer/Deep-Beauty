'use client'

import { useState, useEffect } from 'react'
import { toArabicPrice, STATUS_COLORS, STATUS_LABELS, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import {
  ShoppingBagIcon, CurrencyDollarIcon, InboxStackIcon, TagIcon,
  ExclamationCircleIcon, ExclamationTriangleIcon, StarIcon,
  ChartBarIcon, UsersIcon, ArrowTrendingUpIcon, ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

// ─── Types ─────────────────────────────────────────────────────────────────
interface DayData { label: string; count: number; revenue: number }

interface DashboardOrder {
  id: string; order_number: string; customer_name: string
  total: number; status: string; created_at: string
}
interface LowStockProduct {
  id: string; name_ar: string; stock_quantity: number
}
interface DashboardData {
  stats: {
    totalOrders: number; todayOrders: number; totalSales: number
    activeProducts: number; pendingOrders: number
  }
  recentOrders: DashboardOrder[]
  lowStock: LowStockProduct[]
  chartData: { created_at: string; total: number }[]
}

// ─── Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({ days, valueKey, color = 'var(--primary)' }: { days: DayData[]; valueKey: 'count' | 'revenue'; color?: string }) {
  const max = Math.max(...days.map(d => d[valueKey])) || 1
  return (
    <div className="flex items-end gap-1 h-16 mt-4">
      {days.map((day, i) => {
        const pct = Math.max((day[valueKey] / max) * 100, 5)
        const isToday = i === days.length - 1
        return (
          <div key={day.label} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div
              className="absolute bottom-full mb-2 px-2 py-1 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none bg-on-surface"
            >
              {valueKey === 'revenue' ? toArabicPrice(day[valueKey]) : `${day[valueKey]} طلب`}
            </div>
            <div
              className={`w-full rounded-t-lg transition-all duration-300 ${
                isToday ? 'bg-(--chart-color) border-t-2 border-(--chart-color)' : 'bg-(--chart-color)/40'
              }`}
              style={{ height: `${pct}%`, '--chart-color': color } as React.CSSProperties}
            />
            <span className={`text-[9px] font-medium ${isToday ? 'text-primary' : 'text-black/30'}`}>
              {day.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  title, value, icon: Icon, iconBg, iconColor, href, subtitle,
}: {
  title: string; value: string | number; icon: React.ElementType
  iconBg: string; iconColor: string; href?: string; subtitle?: string
}) {
  const inner = (
    <div className="bg-white rounded-2xl p-5 border border-beige transition-all duration-200 hover:shadow-md group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-xs font-medium opacity-50 mb-1">{title}</p>
      <p className="text-2xl font-bold text-on-surface">{value}</p>
      {subtitle && <p className="text-xs opacity-40 mt-1">{subtitle}</p>}
      {href && (
        <p className="text-xs font-semibold mt-3 group-hover:underline text-primary">
          عرض التفاصيل →
        </p>
      )}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [chartDays, setChartDays] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
      .then((json: DashboardData) => {
        if (!json?.stats) throw new Error('Invalid data')
        setData(json)
        const days: DayData[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          const label = i === 0 ? 'اليوم' : d.toLocaleDateString('ar-KW', { weekday: 'short' })
          const dateStr = d.toISOString().slice(0, 10)
          const dayOrders = (json.chartData || []).filter(o => o.created_at.slice(0, 10) === dateStr)
          days.push({ label, count: dayOrders.length, revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0) })
        }
        setChartDays(days)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin w-8 h-8 rounded-full border-[3px] border-beige border-t-primary" />
        <p className="text-sm opacity-40">جارٍ التحميل...</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <ExclamationCircleIcon className="w-12 h-12 mx-auto mb-3 text-red-400" />
        <p className="text-red-500 font-medium">فشل تحميل البيانات</p>
        <button onClick={() => window.location.reload()} className="text-sm underline mt-2 opacity-60">إعادة المحاولة</button>
      </div>
    </div>
  )

  // Guard: if data arrived but stats is missing (e.g. API error shape)
  if (!data.stats) return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <ExclamationCircleIcon className="w-12 h-12 mx-auto mb-3 text-red-400" />
        <p className="text-red-500 font-medium">بيانات الداشبورد غير مكتملة</p>
        <button onClick={() => window.location.reload()} className="text-sm underline mt-2 opacity-60">إعادة المحاولة</button>
      </div>
    </div>
  )

  const { stats, recentOrders, lowStock } = data
  const today = new Date().toLocaleDateString('ar-KW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const weekRevenue = chartDays.reduce((s, d) => s + d.revenue, 0)
  const weekOrders  = chartDays.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface">نظرة عامة</h1>
          <p className="text-xs opacity-40 mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {stats.pendingOrders > 0 && (
            <Link
              href="/admin/orders?status=pending"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-md transition-all hover:opacity-90 active:scale-95 bg-gradient-to-bl from-red-500 to-red-600"
            >
              <ClockIcon className="w-4 h-4" />
              {stats.pendingOrders} طلب معلّق
            </Link>
          )}
          <Link
            href="/admin/orders"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 bg-beige text-on-surface"
          >
            <InboxStackIcon className="w-4 h-4" />
            كل الطلبات
          </Link>
        </div>
      </div>

      {/* ── Low Stock Alert ─────────────────────────────────────────────── */}
      {lowStock.length > 0 && (
        <div className="rounded-2xl p-4 border-2 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
            <p className="text-sm font-bold text-orange-700">
              {lowStock.length} منتج يحتاج تجديد المخزون
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStock.map((p) => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}`}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all group"
              >
                <span className="text-sm font-medium truncate group-hover:text-orange-700">{p.name_ar}</span>
                <span className={`flex-shrink-0 mr-2 text-xs font-bold px-2.5 py-1 rounded-full ${
                  p.stock_quantity === 0
                    ? 'bg-red-100 text-red-600'
                    : 'bg-orange-100 text-orange-600'
                }`}>
                  {p.stock_quantity === 0 ? 'نفذ' : `${p.stock_quantity} متبقي`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الطلبات"
          value={stats.totalOrders}
          icon={InboxStackIcon}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          subtitle="منذ البداية"
        />
        <StatCard
          title="طلبات اليوم"
          value={stats.todayOrders}
          icon={TagIcon}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          subtitle="الطلبات الواردة اليوم"
        />
        <StatCard
          title="إجمالي المبيعات"
          value={toArabicPrice(stats.totalSales)}
          icon={CurrencyDollarIcon}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          subtitle="الإيرادات الكاملة"
        />
        <StatCard
          title="قيد الانتظار"
          value={stats.pendingOrders}
          icon={ClockIcon}
          iconBg={stats.pendingOrders > 0 ? 'bg-red-50' : 'bg-gray-50'}
          iconColor={stats.pendingOrders > 0 ? 'text-red-500' : 'text-gray-400'}
          href={stats.pendingOrders > 0 ? '/admin/orders?status=pending' : undefined}
          subtitle="تحتاج معالجة"
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Orders Chart */}
        <div className="bg-white rounded-2xl p-5 border border-beige">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs font-medium opacity-50">الطلبات — آخر ٧ أيام</p>
              <p className="text-2xl font-bold mt-0.5 text-on-surface">
                {weekOrders}
                <span className="text-sm font-normal opacity-40 mr-1">طلب</span>
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-beige">
              <ArrowTrendingUpIcon className="w-4.5 h-4.5 text-primary" />
            </div>
          </div>
          <BarChart days={chartDays} valueKey="count" />
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-5 border border-beige">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs font-medium opacity-50">الإيرادات — آخر ٧ أيام</p>
              <p className="text-2xl font-bold mt-0.5 text-on-surface">
                {toArabicPrice(weekRevenue)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50">
              <CurrencyDollarIcon className="w-4.5 h-4.5 text-emerald-600" />
            </div>
          </div>
          <BarChart days={chartDays} valueKey="revenue" color="#059669" />
        </div>
      </div>

      {/* ── Recent Orders + Quick Links ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Orders — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border overflow-hidden border-beige">
          <div className="px-5 py-4 border-b flex justify-between items-center border-beige">
            <h2 className="font-bold text-sm text-on-surface">أحدث الطلبات</h2>
            <Link href="/admin/orders" className="text-xs font-semibold hover:opacity-70 transition-opacity text-primary">
              عرض الكل →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
              <InboxStackIcon className="w-12 h-12" />
              <p className="text-sm">لا توجد طلبات بعد</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm bg-surface border-b border-beige">
                  <thead>
                    <tr>
                      {['رقم الطلب', 'العميل', 'المبلغ', 'الحالة', 'التاريخ', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-right text-xs font-bold opacity-50 first:pr-5 last:pl-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, i) => (
                      <tr
                        key={order.id}
                        className={`transition-colors hover:bg-surface ${
                          i < recentOrders.length - 1 ? 'border-b border-beige' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5 pr-5">
                          <span className="font-mono font-bold text-xs text-primary">
                            #{order.order_number}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium">{order.customer_name}</span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-on-surface">
                          {toArabicPrice(order.total)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs opacity-40" dir="ltr">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="px-4 py-3.5 pl-5">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-xs font-semibold hover:opacity-70 transition-opacity text-primary"
                          >
                            تفاصيل
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-4 space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block border rounded-xl p-4 hover:shadow-sm transition-shadow border-beige"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-primary">
                          #{order.order_number}
                        </span>
                        <p className="font-medium text-sm mt-0.5">{order.customer_name}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-on-surface">
                        {toArabicPrice(order.total)}
                      </span>
                      <span className="text-xs opacity-40" dir="ltr">{formatDateTime(order.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Quick Links — 1/3 */}
        <div className="bg-white rounded-2xl border p-5 border-beige">
          <h2 className="font-bold text-sm mb-4 text-on-surface">وصول سريع</h2>
          <div className="space-y-1.5">
            {[
              { href: '/admin/products/new',  icon: ShoppingBagIcon, label: 'إضافة منتج جديد',     sub: 'أضف منتجاً للمتجر',          color: 'text-purple-600', bg: 'bg-purple-50' },
              { href: '/admin/orders',         icon: InboxStackIcon,  label: 'إدارة الطلبات',        sub: `${stats.totalOrders} طلب`,   color: 'text-blue-600',   bg: 'bg-blue-50'   },
              { href: '/admin/customers',      icon: UsersIcon,        label: 'قائمة العملاء',        sub: 'تصفح بيانات العملاء',        color: 'text-teal-600',   bg: 'bg-teal-50'   },
              { href: '/admin/reviews',        icon: StarIcon,         label: 'التقييمات',            sub: 'إدارة تقييمات العملاء',      color: 'text-amber-600',  bg: 'bg-amber-50'  },
              { href: '/admin/flash-sales',    icon: CurrencyDollarIcon, label: 'عروض الفلاش',      sub: 'تشغيل خصم عاجل',            color: 'text-rose-600',   bg: 'bg-rose-50'   },
              { href: '/admin/stats',          icon: ChartBarIcon,    label: 'إحصائيات متقدمة',      sub: 'تحليل مفصّل للمبيعات',       color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 p-2.5 rounded-xl transition-colors group"
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--off-white)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${link.bg}`}>
                  <link.icon className={`w-4 h-4 ${link.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface">{link.label}</p>
                  <p className="text-[11px] opacity-40 truncate">{link.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Products & Active status ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="المنتجات النشطة"
          value={stats.activeProducts}
          icon={ShoppingBagIcon}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          href="/admin/products"
        />
        <div className="bg-white rounded-2xl p-5 border col-span-1 lg:col-span-3 border-beige">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
            <p className="text-xs font-bold opacity-50">حالة المتجر</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'المنتجات النشطة', value: stats.activeProducts, color: '#8b5cf6' },
              { label: 'إيرادات الأسبوع', value: toArabicPrice(weekRevenue), color: '#059669' },
              { label: 'طلبات الأسبوع', value: weekOrders + ' طلب', color: '#2563eb' },
            ].map(item => (
              <div key={item.label} className="text-center p-3 rounded-xl bg-[var(--off-white)]">
                <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[11px] opacity-50 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
