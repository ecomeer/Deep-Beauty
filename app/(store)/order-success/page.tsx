'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { supabase } from '@/lib/supabase'
import { toArabicPrice } from '@/lib/utils'

interface OrderItem {
  id: string
  product_name_ar: string
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  subtotal: number
  shipping_cost: number
  coupon_discount: number
  total: number
  status: string
  address_area: string
  order_items: OrderItem[]
}

function OrderSuccessContent() {
  const params = useSearchParams()
  const orderId = params.get('id')
  const orderNum = params.get('num') || 'DB-XXXXXXXX'
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) { setLoading(false); return }
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        if (data) setOrder(data as Order)
        setLoading(false)
      }, () => setLoading(false))
  }, [orderId])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12" style={{ background: 'var(--off-white)' }}>
      <div className="w-full max-w-lg">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="relative inline-flex mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
              <CheckCircleIcon className="w-14 h-14 text-green-500" />
            </div>
            <div className="absolute -top-1 -right-1 text-2xl animate-bounce">🎉</div>
          </div>

          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
            تم استلام طلبك بنجاح!
          </h1>
          <p className="opacity-70 leading-7" style={{ color: 'var(--text-dark)' }}>
            شكراً لتسوقك من Deep Beauty. سنتواصل معك قريباً لتأكيد الطلب.
          </p>
        </div>

        {/* Order Number */}
        <div className="rounded-2xl p-5 mb-6 text-center" style={{ background: 'var(--beige)' }}>
          <div className="text-sm opacity-60 mb-1">رقم الطلب</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--primary)', direction: 'ltr' }}>{orderNum}</div>
          <div className="text-sm opacity-60 mt-2">⏱️ موعد التسليم المتوقع: ٢-٣ أيام عمل</div>
        </div>

        {/* Order Items */}
        {loading ? (
          <div className="bg-white rounded-2xl p-6 mb-6 flex justify-center">
            <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : order && order.order_items?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
              تفاصيل الطلب
            </h2>
            <div className="space-y-3 mb-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="opacity-70">{item.product_name_ar} × {item.quantity}</span>
                  <span className="font-semibold">{toArabicPrice(item.total_price)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2 text-sm" style={{ borderColor: 'var(--beige)' }}>
              <div className="flex justify-between">
                <span className="opacity-60">المجموع الجزئي</span>
                <span>{toArabicPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">الشحن</span>
                <span className={order.shipping_cost === 0 ? 'text-green-600' : ''}>
                  {order.shipping_cost === 0 ? 'مجاني' : toArabicPrice(order.shipping_cost)}
                </span>
              </div>
              {order.coupon_discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>خصم الكوبون</span>
                  <span>- {toArabicPrice(order.coupon_discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t" style={{ borderColor: 'var(--beige)', color: 'var(--text-dark)' }}>
                <span>الإجمالي</span>
                <span style={{ color: 'var(--primary)' }}>{toArabicPrice(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/products" className="btn-primary px-8 py-4 text-center">
            متابعة التسوق ✦
          </Link>
          <a
            href="https://wa.me/96522289182"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline px-8 py-4 flex items-center justify-center gap-2"
          >
            <span>💬</span> واتساب الدعم
          </a>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
