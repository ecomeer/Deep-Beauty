import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/supabase-server'
import { formatDateTime, STATUS_LABELS, toArabicPrice } from '@/lib/utils'
import PrintButton from './PrintButton'

type Props = { params: Promise<{ id: string }> }

export default async function CustomerInvoicePage({ params }: Props) {
  const { id } = await params
  const { user, error } = await requireUser()
  if (error || !user) notFound()
  const { data: order } = await supabaseAdmin.from('orders').select(`
    id, order_number, customer_name, customer_phone, customer_email,
    address_area, address_block, address_street, address_house,
    subtotal, shipping_cost, coupon_discount, coupon_code, total, status,
    payment_method, payment_status, created_at, paid_at, delivered_at,
    order_items (id, product_name_ar, quantity, unit_price, total_price, product_image_url)
  `).eq('id', id).or(`user_id.eq.${user.id},customer_email.eq.${user.email}`).maybeSingle()
  if (!order) notFound()

  return (
    <div className="max-w-3xl mx-auto py-10 px-4" dir="rtl">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Link href="/account/orders" className="text-sm opacity-60">← العودة للطلبات</Link>
        <PrintButton />
      </div>
      <article className="invoice-print rounded-2xl border border-[var(--beige)] bg-white p-6 shadow-sm">
        <header className="flex justify-between border-b border-[var(--beige)] pb-5 mb-5">
          <div><h1 className="text-xl font-bold text-[var(--primary)]">Deep Beauty | فاتورة</h1><p className="text-sm opacity-60">{order.customer_name}</p></div>
          <div className="text-left"><p className="font-en" dir="ltr">{order.order_number}</p><p className="text-xs opacity-60">{formatDateTime(order.created_at)}</p><p className="text-sm">{STATUS_LABELS[order.status] || order.status}</p></div>
        </header>
        <div className="mb-5 text-sm">{order.address_area}، قطعة {order.address_block}، شارع {order.address_street}، منزل {order.address_house}</div>
        <div className="space-y-3 mb-6">
          {(order.order_items ?? []).map((item: { id: string; product_name_ar: string; quantity: number; unit_price: number; total_price: number; product_image_url?: string | null }) => (
            <div key={item.id} className="flex items-center justify-between border-b border-[var(--beige)] pb-2">
              <div className="flex items-center gap-2">{item.product_image_url && <img src={item.product_image_url} alt="" className="h-10 w-10 rounded object-cover" />}<span>{item.product_name_ar} × {item.quantity}</span></div>
              <span dir="ltr">{toArabicPrice(item.total_price)}</span>
            </div>
          ))}
        </div>
        <div className="mr-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between"><span>المجموع</span><span dir="ltr">{toArabicPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>الشحن</span><span dir="ltr">{toArabicPrice(order.shipping_cost)}</span></div>
          {order.coupon_discount > 0 && <div className="flex justify-between text-green-600"><span>الخصم</span><span dir="ltr">- {toArabicPrice(order.coupon_discount)}</span></div>}
          <div className="flex justify-between border-t border-[var(--beige)] pt-2 text-lg font-bold"><span>الإجمالي</span><span dir="ltr">{toArabicPrice(order.total)}</span></div>
          <p className="text-xs opacity-60">{order.payment_method === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'} — {order.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}</p>
        </div>
      </article>
      <style>{'@media print { body * { visibility: hidden } .invoice-print, .invoice-print * { visibility: visible } .invoice-print { position: absolute; inset: 0; box-shadow: none } }'}</style>
    </div>
  )
}
