'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ClockIcon,
  CubeIcon,
  DocumentTextIcon,
  NoSymbolIcon,
  ShoppingBagIcon,
  TruckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { formatDate, STATUS_COLORS, STATUS_LABELS, toArabicPrice } from '@/lib/utils'
import type { OrderStatus } from '@/lib/order-status'

interface Order {
  id: string
  order_number: string
  total: number
  status: OrderStatus
  created_at: string
  item_count: number
  items: Array<{
    name: string
    image: string | null
    slug: string | null
    quantity: number
    price: number
  }>
}

type Filter = 'all' | 'active' | 'completed' | 'cancelled'

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'كل الطلبات' },
  { key: 'active', label: 'قيد التنفيذ' },
  { key: 'completed', label: 'المكتملة' },
  { key: 'cancelled', label: 'الملغاة' },
]

const STATUS_ICONS: Record<OrderStatus, typeof ClockIcon> = {
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
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/account/orders?filter=${filter}`, { cache: 'no-store' })
      if (res.status === 401) {
        router.replace('/login')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [filter, router])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  async function cancelOrder(order: Order) {
    if (!confirm('هل أنتِ متأكدة من إلغاء هذا الطلب؟')) return
    setCancellingId(order.id)
    try {
      const response = await fetch(`/api/account/orders/${order.id}/cancel`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'تعذر إلغاء الطلب')
      setOrders((current) => current.map((item) => (
        item.id === order.id ? { ...item, status: 'cancelled' } : item
      )))
      toast.success('تم إلغاء الطلب')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر إلغاء الطلب')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-surface pb-16 pt-[var(--nav-height)]">
      <header className="border-b border-outline-variant/50 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:py-6">
          <Link
            href="/account"
            aria-label="العودة إلى حسابي"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/60 transition-colors hover:bg-surface"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-on-surface sm:text-2xl">طلباتي</h1>
            <p className="mt-0.5 text-xs text-on-surface-variant sm:text-sm">تفاصيل الطلبات، التتبع والفواتير</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5 sm:py-8">
        <div className="-mx-4 mb-5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2" role="group" aria-label="تصفية الطلبات">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={filter === item.key}
                onClick={() => setFilter(item.key)}
                className={`min-h-10 whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors ${
                  filter === item.key
                    ? 'bg-primary text-white'
                    : 'border border-outline-variant/50 bg-white text-on-surface-variant'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3" aria-label="جارٍ تحميل الطلبات">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-2xl border border-outline-variant/30 bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <p className="font-bold text-on-surface">تعذر تحميل الطلبات</p>
            <p className="mt-1 text-sm text-on-surface-variant">تحققي من الاتصال ثم حاولي مرة أخرى.</p>
            <button type="button" onClick={fetchOrders} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">
              <ArrowPathIcon className="h-4 w-4" />
              إعادة المحاولة
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/40 bg-white p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
              <ShoppingBagIcon className="h-8 w-8 text-on-surface-variant" />
            </div>
            <h2 className="text-lg font-bold text-on-surface">لا توجد طلبات هنا</h2>
            <p className="mt-1 text-sm text-on-surface-variant">ستظهر طلباتك في هذه الصفحة فور إتمام الشراء.</p>
            <Link href="/products" className="mt-5 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white">تصفح المنتجات</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const StatusIcon = STATUS_ICONS[order.status] || ClockIcon
              const expanded = expandedId === order.id
              return (
                <article key={order.id} className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-white shadow-sm">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${STATUS_COLORS[order.status]}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                          <div>
                            <p className="font-bold text-on-surface" dir="ltr">{order.order_number}</p>
                            <p className="mt-0.5 text-xs text-on-surface-variant">{formatDate(order.created_at)}</p>
                          </div>
                          <p className="font-bold text-on-surface" dir="ltr">{toArabicPrice(Number(order.total))}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                          <span className="text-xs text-on-surface-variant">{order.item_count} {order.item_count === 1 ? 'منتج' : 'منتجات'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link href={`/orders/${order.id}`} className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-3 text-sm font-bold text-white">
                        عرض الطلب
                      </Link>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={`order-items-${order.id}`}
                        onClick={() => setExpandedId(expanded ? null : order.id)}
                        className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-outline-variant/70 px-3 text-sm font-bold text-on-surface"
                      >
                        المنتجات
                        <ChevronDownIcon className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div id={`order-items-${order.id}`} className="border-t border-outline-variant/40 bg-surface/60 p-4 sm:p-5">
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={`${order.id}-${index}`} className="flex items-center gap-3 rounded-xl bg-white p-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
                              {item.image ? (
                                <Image src={item.image} alt={item.name || 'منتج'} width={48} height={48} className="h-full w-full object-contain" />
                              ) : (
                                <CubeIcon className="h-6 w-6 text-on-surface-variant" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-bold text-on-surface">{item.name}</p>
                              <p className="mt-0.5 text-xs text-on-surface-variant">الكمية: {item.quantity}</p>
                            </div>
                            <p className="shrink-0 text-xs font-bold text-on-surface" dir="ltr">{toArabicPrice(Number(item.price) * item.quantity)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Link href={`/orders/${order.id}/invoice`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant/70 bg-white px-3 text-sm font-bold">
                          <DocumentTextIcon className="h-5 w-5 text-primary" />
                          عرض الفاتورة
                        </Link>
                        <Link href={`/track?order=${encodeURIComponent(order.order_number)}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant/70 bg-white px-3 text-sm font-bold">
                          <TruckIcon className="h-5 w-5 text-primary" />
                          تتبع الطلب
                        </Link>
                        {order.status === 'pending' && (
                          <button
                            type="button"
                            disabled={cancellingId === order.id}
                            onClick={() => cancelOrder(order)}
                            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-sm font-bold text-red-600 disabled:opacity-60 sm:col-span-2"
                          >
                            {cancellingId === order.id ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <NoSymbolIcon className="h-5 w-5" />}
                            إلغاء الطلب
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
