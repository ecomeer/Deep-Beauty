'use client'

import { useState, useEffect } from 'react'
import { toArabicPrice } from '@/lib/utils'
import {
  ShoppingBagIcon, UsersIcon, StarIcon,
  ArrowTrendingUpIcon, CalendarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Stats {
  topProducts: Array<{
    product_id: string
    products: { name_ar: string; images: string[] }
    quantity: number
    price: number
  }>
  dailySales: Array<{
    created_at: string
    total: number
    status: string
  }>
  topCustomers: Array<{
    name: string
    phone: string
    totalSpent: number
    ordersCount: number
  }>
  reviewsStats: {
    total: number
    pending: number
    approved: number
    averageRating: number
  }
  period: string
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    fetchStats()
  }, [period])

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/stats?period=${period}`)
      const data = await res.json()
      setStats(data)
    } catch {
      toast.error('فشل تحميل الإحصائيات')
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const totalRevenue = stats?.dailySales?.reduce((sum, s) => sum + Number(s.total), 0) || 0
  const totalOrders = stats?.dailySales?.length || 0

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#9C6644] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">إحصائيات المتجر</h1>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-[#9C6644] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p === '7d' ? '7 أيام' : p === '30d' ? '30 يوم' : p === '90d' ? '3 أشهر' : 'سنة'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">إجمالي المبيعات</p>
          </div>
          <p className="text-2xl font-bold">{toArabicPrice(totalRevenue)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ShoppingBagIcon className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">الطلبات المكتملة</p>
          </div>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <StarIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-500">متوسط التقييم</p>
          </div>
          <p className="text-2xl font-bold">
            {stats?.reviewsStats?.averageRating || 0}
            <span className="text-sm text-gray-400 mr-1">/5</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500">العملاء النشطين</p>
          </div>
          <p className="text-2xl font-bold">{stats?.topCustomers?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShoppingBagIcon className="w-5 h-5" />
            المنتجات الأكثر مبيعاً
          </h2>
          {stats?.topProducts?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد بيانات</p>
          ) : (
            <div className="space-y-3">
              {stats?.topProducts?.slice(0, 5).map((item, index) => (
                <div key={item.product_id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <span className="w-6 h-6 rounded-full bg-[#9C6644] text-white text-sm flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {item.products?.images?.[0] ? (
                      <img src={item.products.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">🧴</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.products?.name_ar}</p>
                    <p className="text-xs text-gray-500">{item.quantity} مباع</p>
                  </div>
                  <p className="font-bold text-sm">{toArabicPrice(Number(item.price) * item.quantity)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            أفضل العملاء
          </h2>
          {stats?.topCustomers?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد بيانات</p>
          ) : (
            <div className="space-y-3">
              {stats?.topCustomers?.slice(0, 5).map((customer, index) => (
                <div key={customer.phone} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{customer.name}</p>
                    <p className="text-xs text-gray-500" dir="ltr">{customer.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{toArabicPrice(customer.totalSpent)}</p>
                    <p className="text-xs text-gray-500">{customer.ordersCount} طلب</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <StarIcon className="w-5 h-5" />
            إحصائيات التقييمات
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-yellow-50">
              <p className="text-3xl font-bold text-yellow-600">{stats?.reviewsStats?.pending || 0}</p>
              <p className="text-sm text-gray-600 mt-1">قيد المراجعة</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50">
              <p className="text-3xl font-bold text-green-600">{stats?.reviewsStats?.approved || 0}</p>
              <p className="text-sm text-gray-600 mt-1">تمت الموافقة</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <p className="text-3xl font-bold text-blue-600">{stats?.reviewsStats?.total || 0}</p>
              <p className="text-sm text-gray-600 mt-1">إجمالي التقييمات</p>
            </div>
          </div>
          
          {/* Rating Distribution */}
          <div className="mt-6">
            <p className="text-sm font-medium mb-3">توزيع التقييمات</p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-8">{rating} ⭐</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{
                        width: `${stats?.reviewsStats?.total ? (stats.reviewsStats.approved / stats.reviewsStats.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
