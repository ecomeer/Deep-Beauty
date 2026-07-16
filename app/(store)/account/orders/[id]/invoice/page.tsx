import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/supabase-server'
import { formatDateTime, STATUS_LABELS, toArabicPrice } from '@/lib/utils'
import { getOrderItemImage } from '@/lib/order-presentation'
import PrintButton from './PrintButton'

type Props = { params: Promise<{ id: string }> }

type InvoiceItem = {
  id: string
  product_name_ar: string
  quantity: number
  unit_price: number
  total_price: number
  product_image_url?: string | null
}

const paymentMethodLabel = (method: string | null) => method === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'
const paymentStatusLabel = (status: string | null) => status === 'paid' ? 'مدفوع' : status === 'refunded' ? 'مسترد' : 'غير مدفوع'

export default async function CustomerInvoicePage({ params }: Props) {
  const { id } = await params
  const { user, error } = await requireUser()
  if (error || !user) notFound()

  const { data: order } = await supabaseAdmin.from('orders').select(`
    id, order_number, customer_name, customer_phone, customer_email,
    address_area, address_block, address_street, address_house, notes,
    subtotal, shipping_cost, coupon_discount, coupon_code, total, status,
    payment_method, payment_status, created_at, paid_at, confirmed_at, processing_at, shipped_at, delivered_at, cancelled_at, refunded_at,
    order_items (id, product_name_ar, quantity, unit_price, total_price, product_image_url)
  `).eq('id', id).or(`user_id.eq.${user.id},customer_email.eq.${user.email}`).maybeSingle()
  if (!order) notFound()

  const items = (order.order_items ?? []) as InvoiceItem[]
  const lifecycle = [
    ['تاريخ الطلب', order.created_at],
    ['تاريخ الدفع', order.paid_at],
    ['تاريخ التأكيد', order.confirmed_at],
    ['بدء المعالجة', order.processing_at],
    ['تاريخ الشحن', order.shipped_at],
    ['تاريخ التسليم', order.delivered_at],
    ['تاريخ الإلغاء', order.cancelled_at],
    ['تاريخ الاسترداد', order.refunded_at],
  ].filter(([, value]) => Boolean(value)) as [string, string][]

  return (
    <div className="max-w-4xl mx-auto py-10 px-4" dir="rtl">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Link href={`/account/orders/${order.id}`} className="text-sm opacity-60 hover:opacity-100">← العودة للطلب</Link>
        <PrintButton />
      </div>
      <article className="invoice-print rounded-2xl border border-[var(--beige)] bg-white p-6 shadow-sm">
        <header className="flex flex-col sm:flex-row sm:justify-between gap-4 border-b border-[var(--beige)] pb-5 mb-5">
          <div>
            <h1 className="text-xl font-bold text-[var(--primary)]">Deep Beauty | فاتورة</h1>
            <p className="text-sm opacity-60">فاتورة عميل — لا تحتوي على بيانات إدارية داخلية</p>
          </div>
          <div className="sm:text-left">
            <p className="font-en font-bold" dir="ltr">{order.order_number}</p>
            <p className="text-xs opacity-60">{formatDateTime(order.created_at)} — توقيت الكويت</p>
            <p className="text-sm">{STATUS_LABELS[order.status] || order.status}</p>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm mb-6">
          <div>
            <h2 className="font-bold mb-2 opacity-70">معلومات العميل</h2>
            <p className="font-bold">{order.customer_name}</p>
            <p className="font-en" dir="ltr">{order.customer_phone}</p>
            {order.customer_email && <p className="font-en" dir="ltr">{order.customer_email}</p>}
          </div>
          <div>
            <h2 className="font-bold mb-2 opacity-70">عنوان التوصيل</h2>
            <p>{order.address_area}، قطعة {order.address_block}، شارع {order.address_street}، منزل {order.address_house}</p>
            {order.notes && <p className="text-xs opacity-60 mt-1">{order.notes}</p>}
          </div>
        </section>

        <section className="mb-6 overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-[var(--off-white)]">
                <th className="text-right p-3 border-b border-[var(--beige)]">المنتج</th>
                <th className="text-center p-3 border-b border-[var(--beige)]">الكمية</th>
                <th className="text-center p-3 border-b border-[var(--beige)]">سعر الوحدة</th>
                <th className="text-left p-3 border-b border-[var(--beige)]">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="p-3 border-b border-[var(--beige)]">
                    <div className="flex items-center gap-2">
                      <img src={getOrderItemImage(item.product_image_url)} alt="" className="h-12 w-12 rounded object-cover" />
                      <span>{item.product_name_ar}</span>
                    </div>
                  </td>
                  <td className="p-3 border-b border-[var(--beige)] text-center">{item.quantity}</td>
                  <td className="p-3 border-b border-[var(--beige)] text-center" dir="ltr">{toArabicPrice(item.unit_price)}</td>
                  <td className="p-3 border-b border-[var(--beige)] text-left" dir="ltr">{toArabicPrice(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="text-sm space-y-2">
            <h2 className="font-bold mb-2 opacity-70">الدفع والمراحل</h2>
            <p>طريقة الدفع: {paymentMethodLabel(order.payment_method)}</p>
            <p>حالة الدفع: {paymentStatusLabel(order.payment_status)}</p>
            <p className="font-en" dir="ltr">مرجع آمن: {order.order_number}</p>
            {lifecycle.map(([label, value]) => <p key={label}>{label}: {formatDateTime(value)}</p>)}
          </div>
          <div className="mr-auto w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><span>المجموع الجزئي</span><span dir="ltr">{toArabicPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>الشحن</span><span dir="ltr">{order.shipping_cost === 0 ? 'مجاني' : toArabicPrice(order.shipping_cost)}</span></div>
            {order.coupon_discount > 0 && <div className="flex justify-between text-green-600"><span>الخصم {order.coupon_code ? `(${order.coupon_code})` : ''}</span><span dir="ltr">- {toArabicPrice(order.coupon_discount)}</span></div>}
            <div className="flex justify-between border-t border-[var(--beige)] pt-2 text-lg font-bold"><span>الإجمالي</span><span dir="ltr">{toArabicPrice(order.total)}</span></div>
          </div>
        </section>
      </article>
      <style>{'@media print { @page { direction: rtl; } body * { visibility: hidden } .invoice-print, .invoice-print * { visibility: visible } .invoice-print { position: absolute; inset: 0; box-shadow: none !important; border: 0 !important } }'}</style>
    </div>
  )
}
