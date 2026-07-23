import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { CONTACT_INFO } from '@/lib/contact'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatDateTime, STATUS_LABELS, toArabicPrice } from '@/lib/utils'
import InvoiceActions from './InvoiceActions'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ num?: string }>
}

type InvoiceItem = {
  id: string
  product_id: string | null
  product_name_ar: string
  product_name_en: string
  quantity: number
  unit_price: number
  total_price: number
}

const COLUMNS = `
  id,order_number,customer_name,customer_phone,customer_email,user_id,
  address_area,address_block,address_street,address_house,address_line1,
  subtotal,shipping_cost,coupon_discount,coupon_code,loyalty_points_redeemed,total,
  status,payment_method,payment_status,created_at,
  order_items(id,product_id,product_name_ar,product_name_en,quantity,unit_price,total_price)
`

const paymentMethodLabel = (method: string) => method === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'
const paymentStatusLabel = (status: string) => status === 'paid' ? 'مدفوع' : status === 'refunded' ? 'مسترد' : 'غير مدفوع'

export default async function CustomerInvoicePage({ params, searchParams }: Props) {
  const { id } = await params
  const { num } = await searchParams

  let order
  if (num) {
    const result = await supabaseAdmin.from('orders').select(COLUMNS).eq('id', id).eq('order_number', num).maybeSingle()
    if (result.error) throw result.error
    order = result.data
  } else {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) notFound()

    const byUserId = await supabaseAdmin.from('orders').select(COLUMNS).eq('id', id).eq('user_id', user.id).maybeSingle()
    if (byUserId.error) throw byUserId.error
    order = byUserId.data

    if (!order && user.email) {
      const byEmail = await supabaseAdmin.from('orders').select(COLUMNS).eq('id', id).eq('customer_email', user.email).maybeSingle()
      if (byEmail.error) throw byEmail.error
      order = byEmail.data
    }
  }

  if (!order) notFound()

  const items = (order.order_items ?? []) as InvoiceItem[]
  const productIds = items.map((item) => item.product_id).filter((value): value is string => Boolean(value))
  const { data: products } = productIds.length
    ? await supabaseAdmin.from('products').select('id,images').in('id', productIds)
    : { data: [] }
  const images = new Map((products ?? []).map((product) => [product.id, product.images?.[0] || null]))

  const preLoyaltyTotal = Number(order.subtotal) - Number(order.coupon_discount || 0) + Number(order.shipping_cost)
  const loyaltyDiscount = order.loyalty_points_redeemed
    ? Math.max(0, Math.round((preLoyaltyTotal - Number(order.total)) * 1000) / 1000)
    : 0
  const address = [
    order.address_area,
    order.address_block ? `قطعة ${order.address_block}` : null,
    order.address_street ? `شارع ${order.address_street}` : null,
    order.address_house ? `منزل ${order.address_house}` : null,
    order.address_line1,
  ].filter(Boolean).join('، ')
  const guestQuery = num ? `?num=${encodeURIComponent(order.order_number)}` : ''
  const pdfQuery = `${guestQuery ? `${guestQuery}&` : '?'}download=1`

  return (
    <>
      <style>{`
        @page { size: A4; margin: 9mm; }
        @media print {
          html, body { background: white !important; }
          .invoice-shell { padding: 0 !important; }
          .invoice-card { border: 1px solid #ddcbbd !important; box-shadow: none !important; }
        }
      `}</style>
      <main className="invoice-shell min-h-screen bg-surface pb-12 pt-[var(--nav-height)] print:bg-white print:pt-0">
        <div className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-8 print:max-w-none print:p-0">
          <div className="mb-3 flex items-center justify-between gap-3 print:hidden">
            <Link href={`/orders/${order.id}${guestQuery}`} className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-on-surface">
              <ChevronRightIcon className="h-5 w-5" />
              تفاصيل الطلب
            </Link>
            <InvoiceActions downloadHref={`/api/orders/${order.id}/invoice${pdfQuery}`} />
          </div>

          <article className="invoice-card overflow-hidden rounded-2xl border border-[#ddcbbd] bg-white shadow-[0_16px_40px_rgba(78,52,35,0.10)] print:rounded-none" dir="rtl">
            <header className="border-b-4 border-[#8b5e3c] bg-[linear-gradient(135deg,#f8efe8_0%,#ead8c9_100%)] p-4 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-white sm:h-20 sm:w-20">
                    <Image src="/logo.png" alt="Deep Beauty" width={80} height={80} className="h-full w-full object-contain" priority />
                  </div>
                  <div className="min-w-0">
                    <p className="font-en text-xl font-bold tracking-wide text-[#7a5033] sm:text-3xl">DEEP BEAUTY</p>
                    <p className="mt-1 text-[11px] font-bold text-[#8b5e3c] sm:text-xs">جمالك يبدأ من الأعماق</p>
                  </div>
                </div>
                <div className="shrink-0 text-left">
                  <p className="text-lg font-bold text-[#3a2a1e]">فاتورة</p>
                  <p className="mt-1 text-[11px] text-[#7b675a] sm:text-xs">{formatDateTime(order.created_at)}</p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-white/80 bg-white/85 px-3 py-3 text-center">
                <p className="truncate font-en text-base font-bold tracking-wide text-[#3a2a1e] sm:text-xl" dir="ltr">{order.order_number}</p>
              </div>
            </header>

            <div className="space-y-5 p-4 sm:p-7">
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#e2d4c9] bg-[#fcfaf8] p-4">
                  <h2 className="border-b border-[#e2d4c9] pb-2 text-sm font-bold text-[#6e4a2d]">العميل</h2>
                  <p className="mt-3 text-sm font-bold">{order.customer_name}</p>
                  <p className="mt-1 text-xs" dir="ltr">{order.customer_phone}</p>
                  {order.customer_email && <p className="mt-1 break-all text-xs" dir="ltr">{order.customer_email}</p>}
                </div>
                <div className="rounded-xl border border-[#e2d4c9] bg-[#fcfaf8] p-4">
                  <h2 className="border-b border-[#e2d4c9] pb-2 text-sm font-bold text-[#6e4a2d]">الطلب والدفع</h2>
                  <dl className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between gap-2"><dt>حالة الطلب</dt><dd className="font-bold">{STATUS_LABELS[order.status] || order.status}</dd></div>
                    <div className="flex justify-between gap-2"><dt>طريقة الدفع</dt><dd className="font-bold">{paymentMethodLabel(order.payment_method)}</dd></div>
                    <div className="flex justify-between gap-2"><dt>حالة الدفع</dt><dd className="font-bold">{paymentStatusLabel(order.payment_status)}</dd></div>
                  </dl>
                </div>
              </section>

              <section>
                <div className="hidden overflow-hidden rounded-xl border border-[#e2d4c9] sm:block">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-[#6e4a2d] text-white">
                      <tr>
                        <th className="p-3 text-right">المنتج</th>
                        <th className="p-3 text-center">الكمية</th>
                        <th className="p-3 text-center">السعر</th>
                        <th className="p-3 text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="even:bg-[#faf6f2]">
                          <td className="border-t border-[#e5d9d0] p-3 font-bold">{item.product_name_ar}</td>
                          <td className="border-t border-[#e5d9d0] p-3 text-center">{item.quantity}</td>
                          <td className="border-t border-[#e5d9d0] p-3 text-center" dir="ltr">{toArabicPrice(Number(item.unit_price))}</td>
                          <td className="border-t border-[#e5d9d0] p-3 text-left font-bold" dir="ltr">{toArabicPrice(Number(item.total_price))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2 sm:hidden">
                  {items.map((item) => {
                    const productImage = item.product_id ? images.get(item.product_id) : null
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#e3d4c9] bg-[#fcfaf8] p-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                          {productImage ? <Image src={productImage} alt={item.product_name_ar} width={56} height={56} className="h-full w-full object-contain" /> : <span className="font-en text-xs text-[#8b5e3c]">DB</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold leading-5">{item.product_name_ar}</p>
                          <p className="mt-1 text-xs text-[#7b675a]">الكمية: {item.quantity}</p>
                        </div>
                        <p className="shrink-0 text-xs font-bold" dir="ltr">{toArabicPrice(Number(item.total_price))}</p>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-[#e2d4c9] text-sm">
                <div className="flex justify-between bg-[#fcfaf8] px-4 py-3"><span>المجموع الفرعي</span><strong dir="ltr">{toArabicPrice(Number(order.subtotal))}</strong></div>
                <div className="flex justify-between border-t border-[#e2d4c9] bg-[#fcfaf8] px-4 py-3"><span>الشحن</span><strong dir="ltr">{Number(order.shipping_cost) === 0 ? 'مجاني' : toArabicPrice(Number(order.shipping_cost))}</strong></div>
                {Number(order.coupon_discount) > 0 && <div className="flex justify-between border-t border-[#e2d4c9] bg-[#fcfaf8] px-4 py-3 text-green-700"><span>الخصم</span><strong dir="ltr">- {toArabicPrice(Number(order.coupon_discount))}</strong></div>}
                {loyaltyDiscount > 0 && <div className="flex justify-between border-t border-[#e2d4c9] bg-[#fcfaf8] px-4 py-3 text-green-700"><span>خصم نقاط الولاء</span><strong dir="ltr">- {toArabicPrice(loyaltyDiscount)}</strong></div>}
                <div className="flex justify-between bg-[#6e4a2d] px-4 py-4 text-base font-bold text-white"><span>الإجمالي</span><strong dir="ltr">{toArabicPrice(Number(order.total))}</strong></div>
              </section>

              <section className="rounded-xl border border-[#e2d4c9] bg-[#fcfaf8] p-4">
                <h2 className="text-sm font-bold text-[#6e4a2d]">عنوان التوصيل</h2>
                <p className="mt-2 text-sm leading-7">{address || 'لم يتم تسجيل عنوان تفصيلي'}</p>
              </section>

              <footer className="border-t border-[#ddcbbd] pt-4 text-center text-xs leading-6 text-[#7b675a]">
                <p className="font-bold text-[#6e4a2d]">شكراً لتسوقكم معنا</p>
                <p dir="ltr">{CONTACT_INFO.phone} · {CONTACT_INFO.email}</p>
              </footer>
            </div>
          </article>
        </div>
      </main>
    </>
  )
}
