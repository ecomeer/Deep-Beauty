'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeftIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  ShoppingBagIcon,
  CubeIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { STATUS_COLORS, formatDate } from '@/lib/utils'
import { ACTIVE_ORDER_STATUSES, type OrderStatus } from '@/lib/order-status'

interface Order {
  id: string
  order_number: string
  total: number
  status: OrderStatus
  created_at: string
  item_count: number
  items: Array<{
    name: string
    image: string
    quantity: number
    price: number
  }>
}

const STATUS_ICONS = {
  pending: ClockIcon,
  confirmed: CheckCircleIcon,
  processing: CubeIcon,
  shipped: TruckIcon,
  delivered: CheckCircleIcon,
  cancelled: XCircleIcon,
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/account/orders?filter=${filter}`)
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch orders')
      }
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {
      toast.error('حدث خطأ أثناء تحميل الطلبات')
    } finally {
      setLoading(false)
    }
  }, [filter, router])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter(order => {
    if (filter === 'active') return ACTIVE_ORDER_STATUSES.includes(order.status)
    if (filter === 'completed') return order.status === 'delivered'
    if (filter === 'cancelled') return order.status === 'cancelled'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/account" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ChevronLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">طلباتي</h1>
              <p className="text-gray-500 text-sm mt-1">سجل طلباتك وتابع حالتها</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'الكل' },
            { key: 'active', label: 'النشطة' },
            { key: 'completed', label: 'المكتملة' },
            { key: 'cancelled', label: 'الملغاة' }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-sm p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingBagIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">لا توجد طلبات</h3>
            <p className="text-gray-500 mb-6">ابدئي رحلة التسوق واكتشفي منتجاتنا المميزة</p>
            <Link href="/products" className="btn-primary inline-block px-8 py-3">
              تصفح المنتجات
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const StatusIcon = STATUS_ICONS[order.status]

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${STATUS_COLORS[order.status]} flex items-center justify-center`}>
                          <StatusIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{order.order_number}</p>
                          <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">{order.total} د.ك</p>
                          <p className="text-sm text-gray-500">{order.item_count} منتج</p>
                        </div>
                        <button
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <EyeIcon className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order Details (Expandable) */}
                  {selectedOrder?.id === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-gray-50 p-6"
                    >
                      <h4 className="font-bold mb-4">تفاصيل الطلب</h4>
                      <div className="space-y-3">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              {item.image ? (
                                <Image
                                  // FIXED: replaced <img> with Next.js <Image> for optimization.
                                  src={item.image}
                                  alt={item.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <CubeIcon className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
                            </div>
                            <p className="font-bold text-sm">{item.price * item.quantity} د.ك</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-3 mt-6">
                        <Link
                          href={`/track?order=${order.order_number}`}
                          className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-center hover:bg-primary-hover transition-colors"
                        >
                          تتبع الطلب
                        </Link>
                        <a
                          href={`/api/orders/${order.id}/invoice`}
                          className="py-3 px-4 rounded-xl border border-gray-200 font-bold text-center hover:bg-gray-50 transition-colors"
                        >
                          ⬇️ الفاتورة
                        </a>
                        {order.status === 'pending' && (
                          <button
                            onClick={async () => {
                              if (!confirm('هل أنت متأكدة من إلغاء هذا الطلب؟')) return
                              const r = await fetch(`/api/account/orders/${order.id}/cancel`, { method: 'POST' })
                              const d = await r.json()
                              if (r.ok) {
                                toast.success('تم إلغاء الطلب')
                                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o))
                                setSelectedOrder(null)
                              } else {
                                toast.error(d.error || 'تعذر الإلغاء')
                              }
                            }}
                            className="flex items-center gap-1.5 px-4 py-3 border-2 border-red-200 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-colors text-sm"
                          >
                            <NoSymbolIcon className="w-4 h-4" />
                            إلغاء الطلب
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold hover:border-primary hover:text-primary transition-colors">
                            إعادة الطلب
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
