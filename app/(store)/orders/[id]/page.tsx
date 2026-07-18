import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { toArabicPrice, formatDateTime } from '@/lib/utils'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ num?: string }>
}

const ORDER_COLUMNS = 'id,order_number,customer_name,customer_email,user_id,status,payment_status,payment_method,total,subtotal,shipping_cost,coupon_discount,created_at,address_area,order_items(*)'

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { num } = await searchParams

  // Same authorization pattern as /api/orders/[id]: guests need id + order
  // number; logged-in users can only view their own order.
  let order
  if (num) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(ORDER_COLUMNS)
      .eq('id', id)
      .eq('order_number', num)
      .maybeSingle()
    if (error) throw error
    order = data
  } else {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) notFound()

    // Two structured queries instead of interpolating auth-derived values
    // into a raw .or() filter string.
    const byUserId = await supabaseAdmin
      .from('orders')
      .select(ORDER_COLUMNS)
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (byUserId.error) throw byUserId.error
    order = byUserId.data

    if (!order && user.email) {
      const byEmail = await supabaseAdmin
        .from('orders')
        .select(ORDER_COLUMNS)
        .eq('id', id)
        .eq('customer_email', user.email)
        .maybeSingle()
      if (byEmail.error) throw byEmail.error
      order = byEmail.data
    }
  }

  if (!order) notFound()

  const invoiceHref = num
    ? `/api/orders/${order.id}/invoice?num=${encodeURIComponent(order.order_number)}`
    : `/api/orders/${order.id}/invoice`

  return (
    <div className="min-h-screen bg-surface pt-32 pb-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-2">تفاصيل الطلب #{order.order_number}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {formatDateTime(order.created_at)}
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
        <div className="flex flex-wrap gap-3">
          <Link href="/orders" className="btn-outline px-4 py-2">العودة للطلبات</Link>
          <Link href={`/track?order=${order.order_number}`} className="btn-primary px-4 py-2">تتبع الطلب</Link>
          <a href={invoiceHref} className="px-4 py-2 rounded-xl border border-beige hover:bg-surface font-bold text-sm flex items-center">
            ⬇️ تحميل الفاتورة
          </a>
        </div>
      </div>
    </div>
  )
}
