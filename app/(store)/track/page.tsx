'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  TruckIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ArchiveBoxIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { toArabicPrice, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Order {
  id: string
  order_number: string
  status: string
  customer_name: string
  customer_phone: string
  total: number
  payment_method: string
  payment_status: string
  shipping_address: string
  created_at: string
  order_items: Array<{
    quantity: number
    price: number
    product: {
      name_ar: string
      images: string[]
    }
  }>
}

interface TrackingEvent {
  id: string
  status: string
  status_label_ar: string
  description_ar: string
  location: string
  created_at: string
}

const STATUS_STEPS = [
  { key: 'pending', label: 'تم الطلب', icon: ClockIcon },
  { key: 'confirmed', label: 'تم التأكيد', icon: CheckCircleIcon },
  { key: 'preparing', label: 'جاري التحضير', icon: ArchiveBoxIcon },
  { key: 'shipped', label: 'تم الشحن', icon: TruckIcon },
  { key: 'delivered', label: 'تم التوصيل', icon: CheckCircleIcon }
]

export default function TrackOrderPage() {
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '')
  const [phone, setPhone] = useState(searchParams.get('phone') || '')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [tracking, setTracking] = useState<TrackingEvent[]>([])

  useEffect(() => {
    const orderParam = searchParams.get('order')
    const phoneParam = searchParams.get('phone')
    if (orderParam && phoneParam) {
      trackOrder(orderParam, phoneParam)
    }
  }, [searchParams])

  async function trackOrder(orderNum: string, phoneNum: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/track?order=${orderNum}&phone=${phoneNum}`)
      const data = await res.json()
      
      if (res.ok) {
        setOrder(data.order)
        setTracking(data.tracking)
      } else {
        toast.error('لم يتم العثور على الطلب')
        setOrder(null)
        setTracking([])
      }
    } catch {
      toast.error('حدث خطأ أثناء البحث')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (orderNumber && phone) {
      trackOrder(orderNumber, phone)
    }
  }

  const getCurrentStep = () => {
    if (!order) return -1
    const statusIndex = STATUS_STEPS.findIndex(s => s.key === order.status)
    return statusIndex >= 0 ? statusIndex : 0
  }

  const currentStep = getCurrentStep()

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-[#9C6644]/10 flex items-center justify-center mx-auto mb-4">
          <TruckIcon className="w-10 h-10 text-[#9C6644]" />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
          تتبع طلبك
        </h1>
        <p className="text-gray-500">أدخل رقم الطلب ورقم الهاتف لمتابعة حالة شحنتك</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">رقم الطلب</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#9C6644] focus:ring-2 focus:ring-[#9C6644]/20 outline-none transition-all"
              placeholder="مثال: DB-12345"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#9C6644] focus:ring-2 focus:ring-[#9C6644]/20 outline-none transition-all"
              placeholder="مثال: +965XXXXXXXX"
              dir="ltr"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !orderNumber || !phone}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin w-5 h-5 rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <MagnifyingGlassIcon className="w-5 h-5" />
              تتبع الطلب
            </>
          )}
        </button>
      </form>

      {/* Order Details */}
      {order && (
        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">رقم الطلب</p>
                <p className="text-xl font-bold" dir="ltr">{order.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">تاريخ الطلب</p>
                <p className="font-medium">{formatDateTime(order.created_at)}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">العميل</p>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">طريقة الدفع</p>
                  <p className="font-medium">
                    {order.payment_method === 'cod' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">الإجمالي</p>
                  <p className="font-bold text-[#9C6644]">{toArabicPrice(order.total)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6">حالة الطلب</h2>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-[#9C6644] rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
              </div>
              
              {/* Steps */}
              <div className="relative flex justify-between">
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = index <= currentStep
                  const isCurrent = index === currentStep
                  const Icon = step.icon
                  
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-[#9C6644] text-white' 
                            : 'bg-gray-100 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-[#9C6644]/20 scale-110' : ''}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-xs font-medium ${isCompleted ? 'text-[#9C6644]' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Tracking Timeline */}
          {tracking.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-6">سجل التتبع</h2>
              <div className="space-y-4">
                {tracking.map((event, index) => (
                  <div 
                    key={event.id}
                    className={`flex gap-4 pb-4 ${index !== tracking.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-[#9C6644]/10 flex items-center justify-center">
                        <CheckCircleIcon className="w-5 h-5 text-[#9C6644]" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold">{event.status_label_ar}</h3>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(event.created_at)}
                        </span>
                      </div>
                      {event.description_ar && (
                        <p className="text-sm text-gray-600 mb-1">{event.description_ar}</p>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPinIcon className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4">المنتجات</h2>
            <div className="space-y-3">
              {order.order_items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name_ar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🧴</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.product?.name_ar}</p>
                    <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                  </div>
                  <p className="font-bold">{toArabicPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Back to Home */}
      <div className="text-center mt-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-[#9C6644] hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  )
}
