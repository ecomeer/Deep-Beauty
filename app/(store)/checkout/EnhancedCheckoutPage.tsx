'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartContext } from '@/context/CartContext'
import { useCountry } from '@/context/CountryContext'

import { toArabicPrice, generateOrderNumber, isKuwaitPhone, COUNTRY_AREAS } from '@/lib/utils'
import { 
  UserIcon, 
  LockClosedIcon, 
  SparklesIcon,
  InformationCircleIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface FormData {
  customer_name: string
  customer_phone: string
  customer_email: string
  address_area: string
  address_block: string
  address_street: string
  address_house: string
  notes: string
}

export default function EnhancedCheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartContext()
  const { formatPrice, countryConfig } = useCountry()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  
  // Form state
  const [submitting, setSubmitting] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
  const [form, setForm] = useState<FormData>({
    customer_name: '', customer_phone: '', customer_email: '',
    address_area: '', address_block: '', address_street: '',
    address_house: '', notes: '',
  })
  
  // Account creation option
  const [createAccount, setCreateAccount] = useState(false)
  const [accountPassword, setAccountPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Check if user is logged in
  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setIsLoggedIn(true)
        setUserData(data.user)
        // Pre-fill form with user data
        setForm(prev => ({
          ...prev,
          customer_name: data.user.name || '',
          customer_email: data.user.email || '',
          customer_phone: data.user.phone || ''
        }))
      }
    } catch {
      // User not logged in, continue as guest
    }
  }

  // Shipping costs based on country
  const SHIPPING_COSTS: Record<string, number> = {
    'KW': 0, 'SA': 2.5, 'AE': 2.5, 'QA': 3, 'BH': 2.5, 'OM': 3.5
  }
  const FREE_SHIPPING_THRESHOLDS: Record<string, number | null> = {
    'KW': null, 'SA': 50, 'AE': 50, 'QA': 50, 'BH': 50, 'OM': 60
  }
  
  const countryCode = countryConfig.code

  // Reset area when country changes
  useEffect(() => {
    setForm(prev => ({ ...prev, address_area: '' }))
  }, [countryCode])

  const shippingCost = SHIPPING_COSTS[countryCode] ?? 2.5
  const freeThreshold = FREE_SHIPPING_THRESHOLDS[countryCode]
  const shipping = freeThreshold && subtotal >= freeThreshold ? 0 : shippingCost
  const total = subtotal + shipping - couponDiscount

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(`❌ ${json.error}`); setCouponLoading(false); return }
      setCouponDiscount(json.discount)
      setCouponApplied(json.code)
      toast.success(`✅ تم تطبيق كود ${json.code} — خصم ${formatPrice(json.discount)}`)
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
    if (createAccount && accountPassword.length < 8) { toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }

    setSubmitting(true)
    try {
      // Create account first if requested
      let userId = null
      if (createAccount && form.customer_email) {
        const registerRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.customer_name,
            email: form.customer_email,
            phone: form.customer_phone,
            password: accountPassword
          })
        })
        
        if (registerRes.ok) {
          const registerData = await registerRes.json()
          userId = registerData.user?.id
          toast.success('✅ تم إنشاء حسابك بنجاح!')
        } else {
          // Account creation failed but continue with order
          console.log('Account creation failed, continuing as guest')
        }
      }

      const orderNumber = generateOrderNumber()
      const address = `${form.address_area}، قطعة ${form.address_block}، شارع ${form.address_street}، ${form.address_house}`

      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
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
          payment_method: paymentMethod,
          user_id: userId || null,
          items: items.map(item => ({
            id: item.id,
            name_ar: item.name_ar,
            name_en: item.name_en,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      })

      const checkoutJson = await checkoutRes.json()
      if (!checkoutRes.ok) throw new Error(checkoutJson.error || 'فشل في إنشاء الطلب')
      const order = checkoutJson.order

      // If online payment
      if (paymentMethod === 'online') {
        const paymentRes = await fetch('/api/payment/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            orderNumber,
            amount: Math.max(0, total),
            customerName: form.customer_name,
            customerPhone: form.customer_phone,
            customerEmail: form.customer_email,
          }),
        })

        if (!paymentRes.ok) throw new Error('Failed to initiate payment')

        const { paymentUrl } = await paymentRes.json()
        window.location.href = paymentUrl
        return
      }

      clearCart()
      
      // Show success message with account creation info
      if (createAccount) {
        router.push(`/order-success?id=${order.id}&num=${orderNumber}&account=created`)
      } else {
        router.push(`/order-success?id=${order.id}&num=${orderNumber}`)
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      const errorMessage = err?.message || err?.error_description || err?.error?.message || 'حدث خطأ أثناء إرسال الطلب'
      toast.error(`❌ ${errorMessage}`)
    }
    setSubmitting(false)
  }

  if (items.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 bg-surface pt-32">
      <motion.div 
        initial={{ scale: 0 }} 
        animate={{ scale: 1 }} 
        className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center"
      >
        <span className="text-5xl">🛒</span>
      </motion.div>
      <h2 className="text-2xl font-headline text-on-surface">السلة فارغة</h2>
      <p className="text-on-surface-variant">أضفي منتجات إلى سلة التسوق أولاً</p>
      <Link href="/products" className="bg-primary text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-container transition-colors">
        تسوق الآن
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 bg-surface pt-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-headline mb-3 text-on-surface">
            إتمام الطلب
          </h1>
          <p className="text-on-surface-variant">أكملي بياناتك لإتمام طلبك بسهولة وأمان</p>
        </div>

        {/* Guest/Login Banner */}
        <AnimatePresence mode="wait">
          {!isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">الدفع كزائر</h3>
                    <p className="text-sm text-on-surface-variant">
                      لا حاجة لإنشاء حساب! يمكنك إتمام طلبك مباشرة. 
                      <span className="text-primary font-medium"> إنشاء الحساب اختياري.</span>
                    </p>
                  </div>
                </div>
                <Link 
                  href="/login?redirect=/checkout" 
                  className="px-6 py-2.5 bg-white border-2 border-blue-200 text-blue-600 rounded-xl font-medium hover:border-blue-300 hover:bg-blue-50 transition-all whitespace-nowrap"
                >
                  تسجيل الدخول
                </Link>
              </div>
            </motion.div>
          )}

          {isLoggedIn && userData && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">أهلاً بكِ، {userData.name}!</h3>
                  <p className="text-sm text-gray-600">
                    تم استيراد بياناتك تلقائياً. يمكنك تعديلها إذا لزم الأمر.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Info */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
                  المعلومات الشخصية
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="field-name" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                      الاسم الكامل *
                    </label>
                    <input
                      id="field-name"
                      name="customer_name"
                      value={form.customer_name}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="الاسم الكامل للتوصيل"
                    />
                  </div>
                  <div>
                    <label htmlFor="field-phone" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                      رقم الهاتف *
                    </label>
                    <input
                      id="field-phone"
                      name="customer_phone" 
                      value={form.customer_phone} 
                      onChange={handleChange} 
                      required 
                      className="input-field" 
                      placeholder="XXXXXXXX" 
                      dir="ltr" 
                    />
                    <p className="text-xs text-gray-500 mt-1">سيتم التواصل معك على هذا الرقم</p>
                  </div>
                  <div>
                    <label htmlFor="field-email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                      البريد الإلكتروني {createAccount && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      id="field-email"
                      name="customer_email" 
                      type="email" 
                      value={form.customer_email} 
                      onChange={handleChange} 
                      required={createAccount}
                      className="input-field" 
                      placeholder={createAccount ? "مطلوب لإنشاء الحساب" : "اختياري - لتتبع الطلب"} 
                      dir="ltr" 
                    />
                  </div>
                </div>

                {/* Optional Account Creation */}
                {!isLoggedIn && (
                  <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--beige)' }}>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={createAccount} 
                          onChange={(e) => {
                            setCreateAccount(e.target.checked)
                            if (!e.target.checked) {
                              setAccountPassword('')
                            }
                          }} 
                          className="w-5 h-5 rounded border-gray-300 text-[#9C6644] focus:ring-[#9C6644] cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 group-hover:text-[#9C6644] transition-colors">
                          إنشاء حساب (اختياري)
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          احفظي بياناتك للطلبات القادمة وتتبعي طلباتك بسهولة
                        </p>
                      </div>
                    </label>

                    <AnimatePresence>
                      {createAccount && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 p-4 bg-[#F5EBE0]/30 rounded-xl">
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-dark)' }}>
                              <LockClosedIcon className="w-4 h-4 inline ml-1" />
                              كلمة المرور *
                            </label>
                            <div className="relative">
                              <input 
                                type={showPassword ? 'text' : 'password'}
                                value={accountPassword}
                                onChange={(e) => setAccountPassword(e.target.value)}
                                required={createAccount}
                                minLength={8}
                                className="input-field pr-12" 
                                placeholder="8 أحرف على الأقل"
                                dir="ltr"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              <InformationCircleIcon className="w-4 h-4 inline ml-1" />
                              سيتم إنشاء حسابك تلقائياً بعد إتمام الطلب
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>

              {/* Address */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
                  عنوان التوصيل
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="field-area" className="block text-sm font-medium mb-1.5">المنطقة / المحافظة *</label>
                    {COUNTRY_AREAS[countryConfig.code] ? (
                      <select id="field-area" name="address_area" value={form.address_area} onChange={handleChange} required className="input-field">
                        <option value="">اختر المنطقة</option>
                        {COUNTRY_AREAS[countryConfig.code].map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    ) : (
                      <input id="field-area" name="address_area" value={form.address_area} onChange={handleChange} required className="input-field" placeholder="أدخل المنطقة / المدينة" />
                    )}
                  </div>
                  <div>
                    <label htmlFor="field-block" className="block text-sm font-medium mb-1.5">القطعة *</label>
                    <input id="field-block" name="address_block" value={form.address_block} onChange={handleChange} required className="input-field" placeholder="رقم القطعة" />
                  </div>
                  <div>
                    <label htmlFor="field-street" className="block text-sm font-medium mb-1.5">الشارع *</label>
                    <input id="field-street" name="address_street" value={form.address_street} onChange={handleChange} required className="input-field" placeholder="رقم الشارع" />
                  </div>
                  <div>
                    <label htmlFor="field-house" className="block text-sm font-medium mb-1.5">المنزل / البناية *</label>
                    <input id="field-house" name="address_house" value={form.address_house} onChange={handleChange} required className="input-field" placeholder="رقم المنزل" />
                  </div>
                  <div>
                    <label htmlFor="field-notes" className="block text-sm font-medium mb-1.5">ملاحظات إضافية</label>
                    <input id="field-notes" name="notes" value={form.notes} onChange={handleChange} className="input-field" placeholder="أي تفاصيل إضافية..." />
                  </div>
                </div>
              </motion.div>

              {/* Payment */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
                  طريقة الدفع
                </h2>
                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-[#9C6644] bg-[rgba(156,102,68,0.05)]'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-[#9C6644]"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-sm mb-1" style={{ color: 'var(--text-dark)' }}>
                        الدفع عند الاستلام
                      </div>
                      <div className="text-xs opacity-60">ادفع كاش أو KNET عند استلام طلبك</div>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'online'
                        ? 'border-[#9C6644] bg-[rgba(156,102,68,0.05)]'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="accent-[#9C6644]"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-sm mb-2" style={{ color: 'var(--text-dark)' }}>
                        الدفع الإلكتروني
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* KNet */}
                        <svg viewBox="0 0 60 36" className="h-6 rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="60" height="36" rx="4" fill="#1B5FA8"/>
                          <text x="7" y="25" fontSize="18" fontWeight="900" fill="#F5C400" fontFamily="Arial">K</text>
                          <text x="24" y="25" fontSize="11" fontWeight="700" fill="white" fontFamily="Arial">net</text>
                        </svg>
                        {/* Visa */}
                        <svg viewBox="0 0 60 36" className="h-6 rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="60" height="36" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
                          <text x="6" y="25" fontSize="16" fontWeight="900" fill="#1A1F71" fontFamily="Arial Narrow,Arial">VISA</text>
                        </svg>
                        {/* Mastercard */}
                        <svg viewBox="0 0 60 36" className="h-6 rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="60" height="36" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
                          <circle cx="23" cy="18" r="10" fill="#EB001B"/>
                          <circle cx="37" cy="18" r="10" fill="#F79E1B"/>
                          <path d="M30 10a10 10 0 0 1 0 16 10 10 0 0 1 0-16z" fill="#FF5F00"/>
                        </svg>
                        {/* Apple Pay */}
                        <svg viewBox="0 0 60 36" className="h-6 rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="60" height="36" rx="4" fill="black"/>
                          <text x="8" y="24" fontSize="12" fontWeight="600" fill="white" fontFamily="Arial"> Pay</text>
                        </svg>
                      </div>
                      <div className="text-xs opacity-60 mt-1">دفع إلكتروني آمن ومشفر</div>
                    </div>
                  </label>
                </div>
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="sticky top-24 h-fit space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>
                  ملخص الطلب
                </h2>
                
                {/* Items */}
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="opacity-70">{item.name_ar} × {item.quantity}</span>
                      <span className="font-semibold" dir="ltr">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="border-t pt-4 mb-4" style={{ borderColor: 'var(--beige)' }}>
                  {couponApplied ? (
                    <div className="flex items-center justify-between p-3 rounded-xl text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                      <span>✅ كود {couponApplied} — خصم {formatPrice(couponDiscount)}</span>
                      <button 
                        type="button" 
                        onClick={() => { setCouponApplied(''); setCouponDiscount(0); setCouponCode('') }} 
                        className="text-red-400 font-bold hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        value={couponCode} 
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                        placeholder="كود الخصم" 
                        className="input-field flex-1 text-sm" 
                        dir="ltr" 
                      />
                      <button 
                        type="button" 
                        onClick={applyCoupon} 
                        disabled={couponLoading} 
                        className="btn-outline px-3 py-2 text-sm flex-shrink-0"
                      >
                        {couponLoading ? '...' : 'تطبيق'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm border-t pt-4" style={{ borderColor: 'var(--beige)' }}>
                  <div className="flex justify-between">
                    <span className="opacity-60">المجموع</span>
                    <span dir="ltr">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">الشحن</span>
                    <span className={shipping === 0 ? 'text-green-600 font-medium' : ''} dir="ltr">
                      {shipping === 0 ? 'مجاني 🎉' : formatPrice(shipping)}
                    </span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>خصم الكوبون</span>
                      <span dir="ltr">- {formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ borderColor: 'var(--beige)', color: 'var(--text-dark)' }}>
                    <span>الإجمالي</span>
                    <span style={{ color: 'var(--primary)' }} dir="ltr">{formatPrice(Math.max(0, total))}</span>
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 mt-5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)} 
                    className="mt-0.5 w-5 h-5 accent-[#9C6644] rounded" 
                  />
                  <span className="text-sm opacity-70" style={{ color: 'var(--text-dark)' }}>
                    أوافق على <Link href="/terms" className="text-[#9C6644] hover:underline">الشروط والأحكام</Link> و
                    <Link href="/privacy" className="text-[#9C6644] hover:underline">سياسة الخصوصية</Link>
                  </span>
                </label>

                {/* Submit Button */}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={submitting || !agreed} 
                  className="btn-primary w-full mt-5 py-4 font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : paymentMethod === 'online' ? (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      الانتقال للدفع الإلكتروني
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      تأكيد الطلب
                    </>
                  )}
                </motion.button>

                {/* Security Note */}
                <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                  <LockClosedIcon className="w-3 h-3" />
                  بياناتك آمنة ومشفرة
                </p>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
