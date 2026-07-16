'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeftIcon, CubeIcon } from '@heroicons/react/24/outline'
import { formatDateTime, STATUS_LABELS, toArabicPrice } from '@/lib/utils'

type OrderItem = { id: string; product_name_ar: string; product_name_en?: string; quantity: number; unit_price: number; line_total: number; image: string }
type Tracking = { id: string; status: string; status_label_ar?: string; description_ar?: string; location?: string; created_at: string }
type Order = { id: string; order_number: string; status: string; payment_method: string; payment_status: string; created_at: string; paid_at?: string; confirmed_at?: string; processing_at?: string; shipped_at?: string; delivered_at?: string; cancelled_at?: string; subtotal: number; shipping_cost: number; coupon_discount: number; total: number; loyalty_points_earned?: number; loyalty_points_redeemed?: number; address_area: string; address_block?: string; address_street?: string; address_house?: string; notes?: string; items: OrderItem[]; tracking: Tracking[] }

const milestoneLabels: Record<string, string> = { created_at: 'تاريخ الطلب', paid_at: 'تاريخ الدفع', confirmed_at: 'تاريخ التأكيد', processing_at: 'بدء المعالجة', shipped_at: 'تاريخ الشحن', delivered_at: 'تاريخ التسليم', cancelled_at: 'تاريخ الإلغاء' }

export default function CustomerOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/account/orders/${params.id}`)
    if (res.status === 401) { router.push('/login'); return }
    if (res.status === 403) { setError('unauthorized'); setLoading(false); return }
    if (res.status === 404) { setError('not-found'); setLoading(false); return }
    if (!res.ok) { setError('error'); setLoading(false); return }
    const data = await res.json()
    setOrder(data.order)
    setLoading(false)
  }, [params.id, router])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" /></div>
  if (error || !order) return <div className="min-h-screen flex items-center justify-center p-6 text-center"><div><h1 className="text-2xl font-bold mb-2">{error === 'not-found' ? 'الطلب غير موجود' : error === 'unauthorized' ? 'غير مصرح' : 'حدث خطأ'}</h1><Link className="btn-primary inline-block px-6 py-3" href="/account/orders">العودة للطلبات</Link></div></div>

  const milestones = Object.entries(milestoneLabels).filter(([key]) => order[key as keyof Order])

  return <main className="min-h-screen bg-[#FAFAFA] px-4 py-6" dir="rtl">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3"><button onClick={() => router.back()} className="p-2 rounded-xl bg-white"><ChevronLeftIcon className="w-5 h-5" /></button><div><h1 className="text-2xl font-bold font-en" dir="ltr">{order.order_number}</h1><p className="text-sm text-gray-500">{formatDateTime(order.created_at)} — توقيت الكويت</p></div></div>
        <div className="flex gap-2"><Link href={`/track?order=${order.order_number}`} className="btn-outline px-4 py-2">تتبع الطلب</Link><Link href={`/account/orders/${order.id}/invoice`} className="btn-primary px-4 py-2">الفاتورة</Link></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm"><h2 className="font-bold mb-4">المنتجات</h2><div className="space-y-3">{order.items.length === 0 ? <p>لا توجد منتجات</p> : order.items.map(item => <div key={item.id} className="flex items-center gap-3 border-b last:border-0 pb-3"><div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">{item.image ? <Image src={item.image} alt={item.product_name_ar} width={64} height={64} className="w-full h-full object-cover" /> : <CubeIcon className="w-7 h-7 text-gray-400" />}</div><div className="flex-1"><p className="font-bold">{item.product_name_ar}</p><p className="text-sm text-gray-500">{toArabicPrice(item.unit_price)} × {item.quantity}</p></div><strong>{toArabicPrice(item.line_total)}</strong></div>)}</div></section>
        <aside className="space-y-6"><section className="bg-white rounded-2xl p-5 shadow-sm"><h2 className="font-bold mb-3">ملخص الطلب</h2><p>{STATUS_LABELS[order.status] || order.status}</p><p className="text-sm text-gray-500">{order.payment_method === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'} — {order.payment_status}</p><div className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><span>المجموع</span><span>{toArabicPrice(order.subtotal)}</span></div><div className="flex justify-between"><span>الخصم</span><span>- {toArabicPrice(order.coupon_discount || 0)}</span></div><div className="flex justify-between"><span>الشحن</span><span>{toArabicPrice(order.shipping_cost)}</span></div><div className="flex justify-between font-bold text-lg border-t pt-2"><span>الإجمالي</span><span>{toArabicPrice(order.total)}</span></div></div></section><section className="bg-white rounded-2xl p-5 shadow-sm"><h2 className="font-bold mb-2">عنوان التوصيل</h2><p>{order.address_area}، قطعة {order.address_block}، شارع {order.address_street}، منزل {order.address_house}</p>{order.notes && <p className="text-sm text-gray-500 mt-2">{order.notes}</p>}</section></aside>
        <section className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white rounded-2xl p-5 shadow-sm"><h2 className="font-bold mb-4">خط الطلب الزمني</h2>{milestones.map(([key, label]) => <p key={key} className="text-sm mb-2"><strong>{label}:</strong> {formatDateTime(order[key as keyof Order] as string)}</p>)}</div><div className="bg-white rounded-2xl p-5 shadow-sm"><h2 className="font-bold mb-4">أحداث التتبع</h2>{order.tracking.length === 0 ? <p className="text-sm text-gray-500">لا توجد تحديثات بعد</p> : order.tracking.map(event => <div key={event.id} className="border-r-2 pr-3 mb-3"><p className="font-bold">{event.status_label_ar || event.status}</p><p className="text-sm text-gray-500">{event.description_ar}</p><p className="text-xs text-gray-400">{formatDateTime(event.created_at)}</p></div>)}</div></section>
      </div>
    </div>
  </main>
}
