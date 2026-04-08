'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartContext } from '@/context/CartContext'
import { supabase } from '@/lib/supabase'
import { toArabicPrice, generateOrderNumber, isKuwaitPhone, KUWAIT_AREAS } from '@/lib/utils'
import toast from 'react-hot-toast'

interface FormData {
  customer_name: string
  customer_phone: string
  customer_email: string
  address_area: string
  address_block: string
  address_street: string
  address_house: string
  address_line1: string
  notes: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartContext()
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [form, setForm] = useState<FormData>({
    customer_name: '', customer_phone: '', customer_email: '',
    address_area: '', address_block: '', address_street: '',
    address_house: '', address_line1: '', notes: '',
  })

  const SHIPPING = 1.5
  const FREE_SHIPPING = 20
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING
  const total = subtotal + shipping - couponDiscount

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .single()

      if (!coupon) { toast.error('❌ كود غير صحيح'); setCouponLoading(false); return }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) { toast.error('❌ الكود منتهي الصلاحية'); setCouponLoading(false); return }
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) { toast.error('❌ تجاوز هذا الكود الحد الأقصى للاستخدام'); setCouponLoading(false); return }
      if (subtotal < coupon.min_order_amount) { toast.error(`❌ الحد الأدنى للطلب ${toArabicPrice(coupon.min_order_amount)}`); setCouponLoading(false); return }

      let discount = coupon.type === 'percentage'
        ? (subtotal * coupon.value) / 100
        : coupon.value
      if (coupon.max_discount_amount) discount = Math.min(discount, coupon.max_discount_amount)

      setCouponDiscount(discount)
      setCouponApplied(coupon.code)
      toast.success(`✅ تم تطبيق كود ${coupon.code} — خصم ${toArabicPrice(discount)}`)
    } catch {
      toast.error('❌ حدث خطأ')
    }
    setCouponLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) { toast.error('يرجى الموافقة على الشروط والأحكام'); return }
    if (!isKuwaitPhone(form.customer_phone)) { toast.error('رقم الهاتف غير صحيح'); return }
    if (items.length === 0) { toast.error('السلة فارغة'); return }

    setSubmitting(true)
    try {
      const orderNumber = generateOrderNumber()
      const address = `${form.address_area}، قطعة ${form.address_block}، شارع ${form.address_street}، ${form.address_house}`

      const { data: order, error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || null,
        address_line1: address,
        address_area: form.address_area,
        address_block: form.address_block,
        address_street: form.address_street,
        address_house: form.address_house,
        notes: form.notes || null,
        subtotal,
        shipping_cost: shipping,
        total: Math.max(0, total),
        coupon_code: couponApplied || null,
        coupon_discount: couponDiscount,
        status: 'pending',
        payment_method: 'cod',
        payment_status: 'unpaid',
      }).select().single()

      if (error || !order) throw error

      await supabase.from('order_items').insert(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          product_name_ar: item.name_ar,
          product_name_en: item.name_en,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }))
      )

      // تقليل المخزون لكل منتج
      await Promise.all(
        items.map((item) =>
          supabase.rpc('decrement_stock', { product_id: item.id, qty: item.quantity })
        )
      )

      // زيادة عداد استخدام الكوبون
      if (couponApplied) {
        await supabase.rpc('increment_coupon_usage', { coupon_code: couponApplied })
      }

      clearCart()
      router.push(`/order-success?id=${order.id}&num=${orderNumber}`)
    } catch (err) {
      console.error(err)
      toast.error('حدث خطأ أثناء إرسال الطلب')
    }
    setSubmitting(false)
  }

  if (items.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
      <div className="text-6xl">🛒</div>
      <h2 className="text-2xl font-bold">السلة فارغة</h2>
      <a href="/products" className="btn-primary px-8 py-3">تسوق الآن</a>
    </div>
  )

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6" style={{ background: 'var(--off-white)' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-10" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>إتمام الطلب</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>المعلومات الشخصية</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>الاسم الكامل *</label>
                    <input name="customer_name" value={form.customer_name} onChange={handleChange} required className="input-field" placeholder="الاسم الكامل" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>رقم الهاتف *</label>
                    <input name="customer_phone" value={form.customer_phone} onChange={handleChange} required className="input-field" placeholder="XXXXXXXX" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>البريد الإلكتروني</label>
                    <input name="customer_email" type="email" value={form.customer_email} onChange={handleChange} className="input-field" placeholder="اختياري" dir="ltr" />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>عنوان التوصيل</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">المنطقة / المحافظة *</label>
                    <select name="address_area" value={form.address_area} onChange={handleChange} required className="input-field">
                      <option value="">اختر المنطقة</option>
                      {KUWAIT_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">القطعة *</label>
                    <input name="address_block" value={form.address_block} onChange={handleChange} required className="input-field" placeholder="رقم القطعة" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">الشارع *</label>
                    <input name="address_street" value={form.address_street} onChange={handleChange} required className="input-field" placeholder="رقم الشارع" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">المنزل / البناية *</label>
                    <input name="address_house" value={form.address_house} onChange={handleChange} required className="input-field" placeholder="رقم المنزل" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">ملاحظات إضافية</label>
                    <input name="notes" value={form.notes} onChange={handleChange} className="input-field" placeholder="أي تفاصيل إضافية..." />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>طريقة الدفع</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer" style={{ borderColor: 'var(--primary)', background: 'rgba(156,102,68,0.05)' }}>
                    <input type="radio" name="payment" value="cod" defaultChecked className="accent-[#9C6644]" />
                    <div>
                      <div className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>💵 الدفع عند الاستلام</div>
                      <div className="text-xs opacity-60">ادفع كاش عند استلام طلبك</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-not-allowed opacity-50" style={{ borderColor: 'var(--beige)' }}>
                    <input type="radio" name="payment" disabled />
                    <div>
                      <div className="font-bold text-sm">💳 KNET</div>
                      <div className="text-xs opacity-60">قريباً</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="sticky top-24 h-fit space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>ملخص الطلب</h2>
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="opacity-70">{item.name_ar} × {item.quantity}</span>
                      <span className="font-semibold">{toArabicPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="border-t pt-4 mb-4" style={{ borderColor: 'var(--beige)' }}>
                  {couponApplied ? (
                    <div className="flex items-center justify-between p-3 rounded-xl text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                      <span>✅ كود {couponApplied} — خصم {toArabicPrice(couponDiscount)}</span>
                      <button type="button" onClick={() => { setCouponApplied(''); setCouponDiscount(0); setCouponCode('') }} className="text-red-400 font-bold">✕</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="كود الخصم" className="input-field flex-1 text-sm" dir="ltr" />
                      <button type="button" onClick={applyCoupon} disabled={couponLoading} className="btn-outline px-3 py-2 text-sm flex-shrink-0">
                        {couponLoading ? '...' : 'تطبيق'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm border-t pt-4" style={{ borderColor: 'var(--beige)' }}>
                  <div className="flex justify-between">
                    <span className="opacity-60">المجموع</span>
                    <span>{toArabicPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">الشحن</span>
                    <span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'مجاني' : toArabicPrice(shipping)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>خصم الكوبون</span>
                      <span>- {toArabicPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t" style={{ borderColor: 'var(--beige)', color: 'var(--text-dark)' }}>
                    <span>الإجمالي</span>
                    <span style={{ color: 'var(--primary)' }}>{toArabicPrice(Math.max(0, total))}</span>
                  </div>
                </div>

                <label className="flex items-start gap-3 mt-5 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-[#9C6644]" />
                  <span className="text-xs opacity-70" style={{ color: 'var(--text-dark)' }}>أوافق على الشروط والأحكام وسياسة الاسترجاع والاستبدال</span>
                </label>

                <button type="submit" disabled={submitting || !agreed} className="btn-primary w-full mt-5 py-4 font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? '⏳ جاري الإرسال...' : 'تأكيد الطلب ✦'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
