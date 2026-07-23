import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ChevronRightIcon,
  DocumentTextIcon,
  MapPinIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatDateTime, STATUS_COLORS, STATUS_LABELS, toArabicPrice } from '@/lib/utils'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ num?: string }>
}

type OrderItem = {
  id: string
  product_name_ar: string
  quantity: number
  unit_price: number
  total_price: number
}

const ORDER_COLUMNS = `
  id,order_number,customer_name,customer_email,user_id,status,payment_status,payment_method,
  total,subtotal,shipping_cost,coupon_discount,created_at,
  address_area,address_block,address_street,address_house,address_line1,
  order_items(id,product_name_ar,quantity,unit_price,total_price)
`

const paymentMethodLabel = (method: string) => method === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'
const paymentStatusLabel = (status: string) => status === 'paid' ? 'مدفوع' : status === 'refunded' ? 'مسترد' : 'غير مدفوع'

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { num } = await searchParams

  let order
  if (num) {
    const result = await supabaseAdmin
      .from('orders')
      .select(ORDER_COLUMNS)
      .eq('id', id)
      .eq('order_number', num)
      .maybeSingle()
    if (result.error) throw result.error
    order = result.data
  } else {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) notFound()

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

  const query = num ? `?num=${encodeURIComponent(order.order_number)}` : ''
  const items = (order.order_items ?? []) as OrderItem[]
  const address = [
    order.address_area,
    order.address_block ? `قطعة ${order.address_block}` : null,
    order.address_street ? `شارع ${order.address_street}` : null,
    order.address_house ? `منزل ${order.address_house}` : null,
    order.address_line1,
  ].filter(Boolean).join('، ')

  return (
    <main className="min-h-screen bg-surface pb-16 pt-[var(--nav-height)]">
      <header className="border-b border-outline-variant/50 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:py-6">
          <Link
            href={num ? '/orders' : '/account/orders'}
            aria-label="العودة إلى الطلبات"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/60"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-on-surface-variant">تفاصيل الطلب</p>
            <h1 className="truncate text-lg font-bold text-on-surface sm:text-xl" dir="ltr">{order.order_number}</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:py-8">
        <section className="rounded-2xl border border-outline-variant/40 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-on-surface-variant">تاريخ الطلب</p>
              <p className="mt-1 text-sm font-bold text-on-surface">{formatDateTime(order.created_at)}</p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface p-3">
              <p className="text-xs text-on-surface-variant">طريقة الدفع</p>
              <p className="mt-1 text-sm font-bold text-on-surface">{paymentMethodLabel(order.payment_method)}</p>
            </div>
            <div className="rounded-xl bg-surface p-3">
              <p className="text-xs text-on-surface-variant">حالة الدفع</p>
              <p className="mt-1 text-sm font-bold text-on-surface">{paymentStatusLabel(order.payment_status)}</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-white shadow-sm">
          <h2 className="border-b border-outline-variant/40 px-4 py-4 text-base font-bold sm:px-6">منتجات الطلب</h2>
          <div className="divide-y divide-outline-variant/30">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-6 text-on-surface">{item.product_name_ar}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {item.quantity} × <span dir="ltr">{toArabicPrice(Number(item.unit_price))}</span>
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-on-surface" dir="ltr">{toArabicPrice(Number(item.total_price))}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-white shadow-sm">
          <div className="flex justify-between px-4 py-3 text-sm sm:px-6"><span>المجموع الفرعي</span><span dir="ltr">{toArabicPrice(Number(order.subtotal))}</span></div>
          <div className="flex justify-between border-t border-outline-variant/30 px-4 py-3 text-sm sm:px-6"><span>الشحن</span><span dir="ltr">{Number(order.shipping_cost) === 0 ? 'مجاني' : toArabicPrice(Number(order.shipping_cost))}</span></div>
          {Number(order.coupon_discount) > 0 && (
            <div className="flex justify-between border-t border-outline-variant/30 px-4 py-3 text-sm text-green-700 sm:px-6"><span>الخصم</span><span dir="ltr">- {toArabicPrice(Number(order.coupon_discount))}</span></div>
          )}
          <div className="flex justify-between bg-primary px-4 py-4 text-base font-bold text-white sm:px-6"><span>الإجمالي</span><span dir="ltr">{toArabicPrice(Number(order.total))}</span></div>
        </section>

        <section className="rounded-2xl border border-outline-variant/40 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-on-surface">عنوان التوصيل</h2>
              <p className="mt-1 text-sm leading-7 text-on-surface-variant">{address || 'لم يتم تسجيل عنوان تفصيلي'}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link href={`/orders/${order.id}/invoice${query}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white">
            <DocumentTextIcon className="h-5 w-5" />
            عرض الفاتورة
          </Link>
          <Link href={`/track?order=${encodeURIComponent(order.order_number)}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-outline-variant/70 bg-white px-4 text-sm font-bold">
            <TruckIcon className="h-5 w-5 text-primary" />
            تتبع الطلب
          </Link>
        </div>
      </div>
    </main>
  )
}
