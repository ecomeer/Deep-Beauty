import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth-admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { toArabicPrice, formatDateTime, STATUS_LABELS } from '@/lib/utils'
import { CONTACT_INFO } from '@/lib/contact'
import { getOrderItemImage } from '@/lib/order-presentation'
import PrintButton from './PrintButton'

type Props = { params: Promise<{ id: string }> }

interface InvoiceItem {
  id: string
  product_name_ar: string
  quantity: number
  unit_price: number
  total_price: number
  product_image_url?: string | null
  product_id?: string | null
}

export default async function OrderInvoicePage({ params }: Props) {
  const { id } = await params
  const cookieHeader = (await cookies()).getAll().map((cookie) => `${cookie.name}=${cookie.value}`).join('; ')
  const authError = await requireAdmin(new NextRequest('http://localhost/admin-invoice', { headers: { cookie: cookieHeader } }), 'orders')
  if (authError) notFound()
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_phone, customer_email,
      address_area, address_block, address_street, address_house,
      subtotal, shipping_cost, coupon_discount, coupon_code, total,
      status, payment_method, payment_status, created_at, paid_at, confirmed_at, processing_at, shipped_at, delivered_at, cancelled_at, refunded_at,
      order_items ( id, product_name_ar, quantity, unit_price, total_price, product_image_url )
    `)
    .eq('id', id)
    .maybeSingle()

  if (!order) notFound()

  const items = (order.order_items ?? []) as InvoiceItem[]
  const missingSnapshotProductIds = Array.from(new Set(items.filter((item) => !item.product_image_url && item.product_id).map((item) => item.product_id as string)))
  let currentImageByProductId = new Map<string, string | null>()
  if (missingSnapshotProductIds.length > 0) {
    const { data: products } = await supabaseAdmin.from('products').select('id, images').in('id', missingSnapshotProductIds)
    currentImageByProductId = new Map((products ?? []).map((product) => [product.id, product.images?.[0] ?? null]))
  }

  return (
    <>
      {/* Print: show only the invoice card */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-print, .invoice-print * { visibility: visible; }
          .invoice-print { position: absolute; inset: 0; margin: 0 !important; box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4 print:hidden">
          <Link href={`/admin/orders/${order.id}`} className="text-sm font-bold opacity-60 hover:opacity-100">
            ← عودة للطلب
          </Link>
          <PrintButton />
        </div>

        <div className="invoice-print bg-white rounded-2xl shadow-sm border border-[var(--beige)] p-8" dir="rtl">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-[var(--beige)] pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">Deep Beauty | ديب بيوتي</h1>
              <p className="text-sm opacity-60 mt-1">{CONTACT_INFO.location} · {CONTACT_INFO.phone}</p>
              <p className="text-sm opacity-60">{CONTACT_INFO.email}</p>
            </div>
            <div className="text-left">
              <div className="text-lg font-bold">فاتورة</div>
              <div className="font-en text-sm" dir="ltr">{order.order_number}</div>
              <div className="text-xs opacity-60 mt-1">{formatDateTime(order.created_at)} (توقيت الكويت)</div>
              <div className="text-xs mt-1">{STATUS_LABELS[order.status] || order.status}</div>
            </div>
          </div>

          {/* Customer */}
          <div className="grid grid-cols-2 gap-6 text-sm mb-6">
            <div>
              <div className="font-bold mb-1 opacity-60">العميل</div>
              <div className="font-bold">{order.customer_name}</div>
              <div className="font-en" dir="ltr">{order.customer_phone}</div>
              {order.customer_email && <div className="font-en" dir="ltr">{order.customer_email}</div>}
            </div>
            <div>
              <div className="font-bold mb-1 opacity-60">عنوان التوصيل</div>
              <div>{order.address_area}</div>
              <div>قطعة {order.address_block}، شارع {order.address_street}، منزل {order.address_house}</div>
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-sm border-collapse mb-6">
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
                      <img src={getOrderItemImage(item.product_image_url, item.product_id ? currentImageByProductId.get(item.product_id) : null)} alt="" className="h-10 w-10 rounded object-cover" />
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

          {/* Totals */}
          <div className="max-w-xs mr-auto text-sm space-y-2">
            <div className="flex justify-between">
              <span className="opacity-70">المجموع الجزئي</span>
              <span dir="ltr">{toArabicPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">الشحن</span>
              <span dir="ltr">{order.shipping_cost === 0 ? 'مجاني' : toArabicPrice(order.shipping_cost)}</span>
            </div>
            {order.coupon_discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>الخصم {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                <span dir="ltr">- {toArabicPrice(order.coupon_discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-[var(--beige)] pt-2">
              <span>الإجمالي</span>
              <span dir="ltr">{toArabicPrice(order.total)}</span>
            </div>
            <div className="text-xs opacity-60 pt-2 space-y-1">
              <div>تاريخ الدفع: {order.paid_at ? formatDateTime(order.paid_at) : '—'}</div>
              <div>تأكيد: {order.confirmed_at ? formatDateTime(order.confirmed_at) : '—'} · شحن: {order.shipped_at ? formatDateTime(order.shipped_at) : '—'} · تسليم: {order.delivered_at ? formatDateTime(order.delivered_at) : '—'}</div>
              <div>طريقة الدفع: {order.payment_method === 'cod' ? 'دفع عند الاستلام' : 'دفع إلكتروني'} — {order.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}</div>
              <div className="font-en" dir="ltr">Safe reference: {order.order_number}</div>
            </div>
          </div>

          <div className="text-center text-xs opacity-50 border-t border-[var(--beige)] mt-8 pt-4">
            شكراً لتسوقكم مع Deep Beauty 💚
          </div>
        </div>
      </div>
    </>
  )
}
