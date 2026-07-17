import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { toArabicPrice, formatDateTime, STATUS_LABELS } from '@/lib/utils'
import { CONTACT_INFO } from '@/lib/contact'
import PrintButton from './PrintButton'

type Props = { params: Promise<{ id: string }> }

interface InvoiceItem {
  id: string
  product_id: string | null
  product_name_ar: string
  product_name_en: string
  quantity: number
  unit_price: number
  total_price: number
}

const paymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    cod: 'الدفع عند الاستلام',
    knet: 'كي نت',
    card: 'بطاقة بنكية',
    upayments: 'دفع إلكتروني',
  }
  return labels[method] || 'دفع إلكتروني'
}

const paymentStatusLabel = (status: string) => {
  if (status === 'paid') return 'مدفوع'
  if (status === 'refunded') return 'مسترد'
  return 'غير مدفوع'
}

export default async function OrderInvoicePage({ params }: Props) {
  const { id } = await params
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_phone, customer_email,
      address_area, address_block, address_street, address_house, address_line1,
      subtotal, shipping_cost, coupon_discount, coupon_code, loyalty_points_redeemed, total,
      status, payment_method, payment_status, created_at,
      order_items ( id, product_id, product_name_ar, product_name_en, quantity, unit_price, total_price )
    `)
    .eq('id', id)
    .maybeSingle()

  if (!order) notFound()

  const items = (order.order_items ?? []) as InvoiceItem[]
  const productIds = items.map((item) => item.product_id).filter((value): value is string => Boolean(value))
  const { data: products } = productIds.length
    ? await supabaseAdmin.from('products').select('id, images').in('id', productIds)
    : { data: [] }
  const productImages = new Map((products ?? []).map((product) => [product.id, product.images?.[0] || null]))

  const preLoyaltyTotal = order.subtotal - (order.coupon_discount || 0) + order.shipping_cost
  const loyaltyDiscount = order.loyalty_points_redeemed
    ? Math.max(0, Math.round((preLoyaltyTotal - order.total) * 1000) / 1000)
    : 0
  const isPaid = order.payment_status === 'paid'
  const addressParts = [
    order.address_area,
    order.address_block ? `قطعة ${order.address_block}` : null,
    order.address_street ? `شارع ${order.address_street}` : null,
    order.address_house ? `منزل ${order.address_house}` : null,
    order.address_line1,
  ].filter(Boolean)

  return (
    <>
      <style>{`
        @page { size: A4; margin: 8mm; }
        @media print {
          html, body { background: #fff !important; }
          body * { visibility: hidden; }
          .invoice-print, .invoice-print * { visibility: visible; }
          .invoice-print {
            position: absolute; inset: 0; width: 100%; margin: 0 !important;
            box-shadow: none !important; border: 1px solid #e3d2c5 !important;
            print-color-adjust: exact; -webkit-print-color-adjust: exact;
          }
          .invoice-print .mobile-items { display: none !important; }
          .invoice-print .desktop-table { display: table !important; }
        }
      `}</style>

      <div className="mx-auto max-w-5xl pb-10">
        <div className="mb-5 flex flex-col gap-4 print:hidden">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#3a2a1e]">تفاصيل الطلب</h1>
            <Link
              href={`/admin/orders/${order.id}`}
              aria-label="إغلاق الفاتورة والعودة للطلب"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#6e4a2d] transition hover:bg-[#eee0d5]"
            >
              <XMarkIcon className="h-6 w-6" />
            </Link>
          </div>
          <PrintButton
            orderId={order.id}
            orderNumber={order.order_number}
            customerName={order.customer_name}
            customerPhone={order.customer_phone}
            total={toArabicPrice(order.total)}
          />
        </div>

        <article className="invoice-print overflow-hidden border border-[#ddcbbd] bg-white shadow-[0_22px_60px_rgba(78,52,35,0.10)]" dir="rtl">
          <header className="relative overflow-hidden border-b-4 border-[#8b5e3c] bg-[linear-gradient(135deg,#f8efe8_0%,#ead8c9_55%,#dcc1ad_100%)] px-5 py-6 sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full border border-white/50 bg-white/15" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white shadow-sm sm:h-24 sm:w-24">
                  <Image src="/logo.png" alt="Deep Beauty" width={96} height={96} className="h-full w-full object-contain" priority />
                </div>
                <div>
                  <p className="font-en text-3xl font-semibold tracking-wide text-[#7a5033] sm:text-4xl">DEEP BEAUTY</p>
                  <p className="mt-1 text-xs font-bold tracking-[0.18em] text-[#8b5e3c]">جمالك يبدأ من الأعماق</p>
                </div>
              </div>

              <div className="w-full rounded-3xl border border-white/70 bg-white/85 px-5 py-4 text-sm leading-7 shadow-sm sm:w-auto sm:min-w-64">
                <p><span className="font-bold">تاريخ الطلب:</span> {formatDateTime(order.created_at)}</p>
                <p><span className="font-bold">الشحن:</span> توصيل للمنزل</p>
              </div>
            </div>

            <div className="relative mt-6 rounded-full border border-white/80 bg-white px-5 py-3 text-center shadow-sm">
              <p className="font-en text-xl font-bold tracking-[0.12em] text-[#3a2a1e] sm:text-2xl" dir="ltr">{order.order_number}</p>
            </div>
            <div className="relative mt-3 flex justify-center">
              <span className={`rounded-full px-5 py-1.5 text-sm font-bold ${isPaid ? 'bg-[#d9f5e2] text-[#25643b]' : 'bg-[#fff0cf] text-[#875b16]'}`}>
                {paymentStatusLabel(order.payment_status)}
              </span>
            </div>
          </header>

          <div className="space-y-6 p-4 sm:p-7">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border border-[#e2d4c9] bg-[#fcfaf8] p-5">
                <h2 className="border-b border-[#d9c9bc] pb-3 text-base font-bold text-[#6e4a2d]">معلومات العميل</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div><dt className="inline font-bold">اسم العميل: </dt><dd className="inline">{order.customer_name}</dd></div>
                  <div><dt className="inline font-bold">هاتف العميل: </dt><dd className="inline font-en" dir="ltr">{order.customer_phone}</dd></div>
                  {order.customer_email && <div className="break-all"><dt className="inline font-bold">البريد الإلكتروني: </dt><dd className="inline font-en" dir="ltr">{order.customer_email}</dd></div>}
                </dl>
              </div>
              <div className="border border-[#e2d4c9] bg-[#fcfaf8] p-5">
                <h2 className="border-b border-[#d9c9bc] pb-3 text-base font-bold text-[#6e4a2d]">حالة الدفع</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div><dt className="inline font-bold">طريقة الدفع: </dt><dd className="inline">{paymentMethodLabel(order.payment_method)}</dd></div>
                  <div><dt className="inline font-bold">حالة الدفع: </dt><dd className="inline">{paymentStatusLabel(order.payment_status)}</dd></div>
                  <div><dt className="inline font-bold">حالة الطلب: </dt><dd className="inline">{STATUS_LABELS[order.status] || order.status}</dd></div>
                  <div><dt className="inline font-bold">مرجع الفاتورة: </dt><dd className="inline font-en" dir="ltr">{order.order_number}</dd></div>
                </dl>
              </div>
            </section>

            <section>
              <div className="desktop-table hidden overflow-x-auto sm:block">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[#6e4a2d] text-white">
                    <tr>
                      <th className="w-12 border-l border-white/20 p-3 text-center">#</th>
                      <th className="w-20 border-l border-white/20 p-3 text-center">صورة</th>
                      <th className="border-l border-white/20 p-3 text-right">اسم المنتج</th>
                      <th className="w-20 border-l border-white/20 p-3 text-center">الكمية</th>
                      <th className="w-32 border-l border-white/20 p-3 text-center">السعر</th>
                      <th className="w-32 p-3 text-center">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const productImage = item.product_id ? productImages.get(item.product_id) : null
                      return (
                        <tr key={item.id} className="even:bg-[#faf6f2]">
                          <td className="border border-[#e5d9d0] p-3 text-center font-en">{index + 1}</td>
                          <td className="border border-[#e5d9d0] p-2 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[#e5d9d0] bg-white">
                              {productImage ? <Image src={productImage} alt={item.product_name_ar} width={56} height={56} className="h-full w-full object-contain" /> : <span className="text-xl text-[#b8845f]">DB</span>}
                            </div>
                          </td>
                          <td className="border border-[#e5d9d0] p-3 font-bold">{item.product_name_ar}<span className="mt-1 block font-en text-xs font-normal text-[#8a7465]">{item.product_name_en}</span></td>
                          <td className="border border-[#e5d9d0] p-3 text-center">{item.quantity}</td>
                          <td className="border border-[#e5d9d0] p-3 text-center" dir="ltr">{toArabicPrice(item.unit_price)}</td>
                          <td className="border border-[#e5d9d0] p-3 text-center font-bold" dir="ltr">{toArabicPrice(item.total_price)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mobile-items space-y-3 sm:hidden">
                {items.map((item, index) => {
                  const productImage = item.product_id ? productImages.get(item.product_id) : null
                  return (
                    <div key={item.id} className="flex gap-3 rounded-2xl border border-[#e3d4c9] bg-[#fcfaf8] p-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e5d9d0] bg-white">
                        {productImage ? <Image src={productImage} alt={item.product_name_ar} width={64} height={64} className="h-full w-full object-contain" /> : <span className="font-en text-[#b8845f]">DB</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold"><span className="ml-1 text-xs text-[#9b7b65]">#{index + 1}</span>{item.product_name_ar}</p>
                        <p className="font-en text-xs text-[#8a7465]">{item.product_name_en}</p>
                        <div className="mt-2 flex justify-between text-xs"><span>الكمية: {item.quantity}</span><span className="font-bold" dir="ltr">{toArabicPrice(item.total_price)}</span></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="overflow-hidden border border-[#e2d4c9] text-sm">
              <div className="flex justify-between bg-[#fcfaf8] px-5 py-3"><span>المجموع الفرعي</span><strong dir="ltr">{toArabicPrice(order.subtotal)}</strong></div>
              <div className="flex justify-between border-t border-[#e2d4c9] bg-[#fcfaf8] px-5 py-3"><span>رسوم الشحن</span><strong dir="ltr">{order.shipping_cost === 0 ? 'مجاني' : toArabicPrice(order.shipping_cost)}</strong></div>
              {order.coupon_discount > 0 && <div className="flex justify-between border-t border-[#e2d4c9] bg-[#fcfaf8] px-5 py-3 text-[#2f7446]"><span>الخصم {order.coupon_code ? `(${order.coupon_code})` : ''}</span><strong dir="ltr">- {toArabicPrice(order.coupon_discount)}</strong></div>}
              {loyaltyDiscount > 0 && <div className="flex justify-between border-t border-[#e2d4c9] bg-[#fcfaf8] px-5 py-3 text-[#2f7446]"><span>خصم نقاط الولاء</span><strong dir="ltr">- {toArabicPrice(loyaltyDiscount)}</strong></div>}
              <div className="flex justify-between bg-[#6e4a2d] px-5 py-4 text-lg font-bold text-white"><span>المجموع الكلي</span><strong dir="ltr">{toArabicPrice(order.total)}</strong></div>
            </section>

            <section className="rounded-[2rem] border border-[#e2d4c9] bg-[#fcfaf8] p-5">
              <h2 className="mb-3 text-base font-bold text-[#6e4a2d]">عنوان الشحن</h2>
              <p className="text-sm leading-7">{addressParts.length ? addressParts.join('، ') : 'لم يتم تسجيل عنوان تفصيلي'}</p>
            </section>

            <section className="border border-[#e2d4c9] bg-[#f7f0ea] p-5">
              <h2 className="mb-4 text-base font-bold text-[#6e4a2d]">معلومات الدفع</h2>
              <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-4">
                <div className="rounded-full bg-white px-4 py-3"><span className="block text-xs text-[#856f61]">مرجع الفاتورة</span><strong className="font-en text-sm" dir="ltr">{order.order_number}</strong></div>
                <div className="rounded-full bg-white px-4 py-3"><span className="block text-xs text-[#856f61]">حالة الدفع</span><strong className="text-sm">{paymentStatusLabel(order.payment_status)}</strong></div>
                <div className="rounded-full bg-white px-4 py-3"><span className="block text-xs text-[#856f61]">طريقة الدفع</span><strong className="text-sm">{paymentMethodLabel(order.payment_method)}</strong></div>
                <div className="rounded-full bg-white px-4 py-3"><span className="block text-xs text-[#856f61]">المبلغ الإجمالي</span><strong className="text-sm" dir="ltr">{toArabicPrice(order.total)}</strong></div>
              </div>
            </section>

            <footer className="border-t border-[#ddcbbd] pt-5 text-center text-xs leading-7 text-[#7b675a]">
              <p className="font-bold text-[#6e4a2d]">شكراً لتسوقكم معنا!</p>
              <p>لأي استفسارات، يرجى التواصل معنا</p>
              <p className="font-en" dir="ltr">{CONTACT_INFO.phone} · {CONTACT_INFO.email}</p>
            </footer>
          </div>
        </article>
      </div>
    </>
  )
}
