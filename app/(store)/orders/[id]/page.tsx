import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { toArabicPrice } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id,order_number,customer_name,status,payment_status,payment_method,total,subtotal,shipping_cost,coupon_discount,created_at,address_area,order_items(*)')
    .eq('id', id)
    .maybeSingle()

  if (!order) notFound()

  return (
    <div className="min-h-screen bg-surface pt-32 pb-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-2">تفاصيل الطلب #{order.order_number}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {/* FIXED: dedicated /orders/[id] detail page for required storefront route. */}
          {new Date(order.created_at).toLocaleString('ar-KW')}
        </p>
        <div className="space-y-3 mb-6">
          {(order.order_items ?? []).map((item: { id: string; product_name_ar: string; quantity: number; total_price: number }) => (
            <div key={item.id} className="flex justify-between border-b pb-2">
              <span>{item.product_name_ar} × {item.quantity}</span>
              <span dir="ltr">{toArabicPrice(item.total_price)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 mb-6">
          <div className="flex justify-between"><span>المجموع</span><span dir="ltr">{toArabicPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>الشحن</span><span dir="ltr">{toArabicPrice(order.shipping_cost)}</span></div>
          {order.coupon_discount > 0 && (
            <div className="flex justify-between text-green-600"><span>الخصم</span><span dir="ltr">- {toArabicPrice(order.coupon_discount)}</span></div>
          )}
          <div className="flex justify-between font-bold text-lg"><span>الإجمالي</span><span dir="ltr">{toArabicPrice(order.total)}</span></div>
        </div>
        <div className="flex gap-3">
          <Link href="/orders" className="btn-outline px-4 py-2">العودة للطلبات</Link>
          <Link href={`/track?order=${order.order_number}`} className="btn-primary px-4 py-2">تتبع الطلب</Link>
        </div>
      </div>
    </div>
  )
}
