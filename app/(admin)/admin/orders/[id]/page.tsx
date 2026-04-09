'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toArabicPrice, STATUS_COLORS, STATUS_LABELS, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  CheckCircleIcon, 
  TruckIcon, 
  DocumentTextIcon, 
  UserIcon, 
  MapPinIcon,
  PlusIcon,
  BellIcon,
  ClockIcon,
  ArchiveBoxIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'

export default function AdminOrderDetail() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [tracking, setTracking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTrackingForm, setShowTrackingForm] = useState(false)
  const [trackingForm, setTrackingForm] = useState({
    status: '',
    status_label_ar: '',
    description_ar: '',
    location: '',
    notify_customer: false
  })

  useEffect(() => {
    fetchOrder()
  }, [])

  async function fetchOrder() {
    const { data: oData } = await supabase.from('orders').select('*').eq('id', params.id).single()
    if (oData) {
      setOrder(oData)
      const { data: iData } = await supabase.from('order_items').select('*').eq('order_id', oData.id)
      setItems(iData || [])
      // Fetch tracking
      const { data: tData } = await supabase.from('order_tracking').select('*').eq('order_id', oData.id).order('created_at', { ascending: false })
      setTracking(tData || [])
    }
    setLoading(false)
  }

  const addTracking = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/admin/orders/${order.id}/tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...trackingForm,
        status_label_en: trackingForm.status_label_ar,
        description_en: trackingForm.description_ar,
        update_order_status: true
      }),
    })
    if (!res.ok) {
      toast.error('حدث خطأ أثناء إضافة التتبع')
    } else {
      toast.success('تم إضافة تحديث التتبع')
      setShowTrackingForm(false)
      setTrackingForm({ status: '', status_label_ar: '', description_ar: '', location: '', notify_customer: false })
      fetchOrder()
      // Notify customer if requested
      if (trackingForm.notify_customer) {
        notifyCustomer()
      }
    }
  }

  const notifyCustomer = async () => {
    const res = await fetch(`/api/admin/orders/${order.id}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'whatsapp',
        message: `تحديث طلب ${order.order_number}: ${trackingForm.status_label_ar} - ${trackingForm.description_ar || ''}`,
        status: trackingForm.status
      }),
    })
    if (res.ok) {
      toast.success('تم إرسال الإشعار للعميل')
    }
  }

  const updateStatus = async (newStatus: string) => {
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      toast.error('حدث خطأ أثناء تحديث الحالة')
    } else {
      toast.success('تم تحديث الطلب بنجاح')
      setOrder({ ...order, status: newStatus })
    }
  }

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>
  if (!order) return <div className="p-10 text-center">الطلب غير موجود</div>

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-sm font-bold opacity-60 hover:opacity-100">← عودة</button>
          <h1 className="text-2xl font-bold font-en" style={{ color: 'var(--text-dark)' }}>{order.order_number}</h1>
          <span className={`badge ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || 'badge-gray'}`}>
            {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
          </span>
        </div>
        
        {/* Status Actions */}
        <div className="flex gap-2">
          {order.status === 'pending' && <button onClick={() => updateStatus('confirmed')} className="btn-primary py-2 text-sm shadow-sm bg-blue-600 hover:bg-blue-700">تأكيد الطلب</button>}
          {order.status === 'confirmed' && <button onClick={() => updateStatus('shipped')} className="btn-primary py-2 text-sm shadow-sm bg-purple-600 hover:bg-purple-700">تحديث كمشحون</button>}
          {order.status === 'shipped' && <button onClick={() => updateStatus('delivered')} className="btn-primary py-2 text-sm shadow-sm bg-green-600 hover:bg-green-700">التسليم بنجاح</button>}
          {order.status !== 'delivered' && order.status !== 'cancelled' && <button onClick={() => updateStatus('cancelled')} className="btn-outline py-2 text-sm text-red-500 border-red-200 hover:bg-red-50">إلغاء الطلب</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Order Details & Customer */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--beige)] overflow-hidden">
            <h2 className="text-lg font-bold p-5 border-b border-[var(--beige)] flex items-center gap-2">
              <ShoppingBagIcon className="w-5 h-5 text-[#9C6644]" /> محتويات الطلب
            </h2>
            <div className="p-5">
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center pb-4 border-b border-[var(--beige)] last:border-0 last:pb-0">
                    <div>
                      <div className="font-bold">{item.product_name_ar}</div>
                      <div className="text-xs opacity-60 font-en">{item.product_name_en}</div>
                      <div className="text-sm mt-1" style={{ color: 'var(--primary)' }}>{toArabicPrice(item.unit_price)} × {item.quantity}</div>
                    </div>
                    <div className="font-bold">{toArabicPrice(item.total_price)}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[var(--off-white)] p-5 border-t border-[var(--beige)] text-sm space-y-3">
              <div className="flex justify-between">
                <span className="opacity-70">المجموع الجزئي:</span>
                <span className="font-medium">{toArabicPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">الشحن:</span>
                <span className="font-medium">{order.shipping_cost === 0 ? 'مجاني' : toArabicPrice(order.shipping_cost)}</span>
              </div>
              {order.coupon_discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>خصم {order.coupon_code && `(${order.coupon_code})`}:</span>
                  <span>- {toArabicPrice(order.coupon_discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-[var(--beige)] pt-3" style={{ color: 'var(--primary)' }}>
                <span>الإجمالي الدفع:</span>
                <span>{toArabicPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Timeline / Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--beige)]">
            <div className="flex items-center justify-between p-5 border-b border-[var(--beige)]">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-[#9C6644]" /> سجل التتبع
              </h2>
              <button
                onClick={() => setShowTrackingForm(!showTrackingForm)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#9C6644] text-white text-sm hover:bg-[#7a5235] transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                تحديث جديد
              </button>
            </div>

            {/* Add Tracking Form */}
            {showTrackingForm && (
              <form onSubmit={addTracking} className="p-5 border-b border-[var(--beige)] bg-gray-50">
                <h3 className="font-bold mb-3">إضافة تحديث جديد</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">الحالة</label>
                    <select
                      value={trackingForm.status}
                      onChange={(e) => setTrackingForm({...trackingForm, status: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      required
                    >
                      <option value="">اختر الحالة</option>
                      <option value="pending">قيد الانتظار</option>
                      <option value="confirmed">تم التأكيد</option>
                      <option value="preparing">جاري التحضير</option>
                      <option value="shipped">تم الشحن</option>
                      <option value="out_for_delivery">في الطريق للتوصيل</option>
                      <option value="delivered">تم التوصيل</option>
                      <option value="cancelled">تم الإلغاء</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">عنوان التحديث</label>
                    <input
                      type="text"
                      value={trackingForm.status_label_ar}
                      onChange={(e) => setTrackingForm({...trackingForm, status_label_ar: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      placeholder="مثال: تم شحن الطلب"
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium mb-1">الوصف / الملاحظات</label>
                  <textarea
                    value={trackingForm.description_ar}
                    onChange={(e) => setTrackingForm({...trackingForm, description_ar: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    rows={2}
                    placeholder="تفاصيل إضافية..."
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium mb-1">الموقع (اختياري)</label>
                  <input
                    type="text"
                    value={trackingForm.location}
                    onChange={(e) => setTrackingForm({...trackingForm, location: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    placeholder="مثال: مستودع الكويت"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackingForm.notify_customer}
                      onChange={(e) => setTrackingForm({...trackingForm, notify_customer: e.target.checked})}
                      className="rounded border-gray-300 text-[#9C6644] focus:ring-[#9C6644]"
                    />
                    <BellIcon className="w-4 h-4" />
                    إعلام العميل
                  </label>
                  <button type="submit" className="btn-primary py-1.5 px-4 text-sm">
                    <PaperAirplaneIcon className="w-4 h-4 inline mr-1" />
                    إضافة
                  </button>
                </div>
              </form>
            )}

            {/* Tracking History */}
            <div className="p-5 text-sm max-h-96 overflow-y-auto">
              {tracking.length === 0 ? (
                <p className="text-gray-500 text-center py-4">لا توجد تحديثات بعد</p>
              ) : (
                <div className="space-y-4">
                  {tracking.map((event, index) => (
                    <div key={event.id} className={`flex gap-3 ${index !== tracking.length - 1 ? 'pb-4 border-b border-gray-100' : ''}`}>
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          event.status === 'delivered' ? 'bg-green-100 text-green-600' :
                          event.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {event.status === 'delivered' ? <CheckCircleIcon className="w-4 h-4" /> :
                           event.status === 'shipped' ? <TruckIcon className="w-4 h-4" /> :
                           event.status === 'preparing' ? <ArchiveBoxIcon className="w-4 h-4" /> :
                           <ClockIcon className="w-4 h-4" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold">{event.status_label_ar}</h4>
                          <span className="text-xs text-gray-500">{formatDateTime(event.created_at)}</span>
                        </div>
                        {event.description_ar && (
                          <p className="text-gray-600 mb-1">{event.description_ar}</p>
                        )}
                        {event.location && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Col: Customer & Shipping */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--beige)]">
            <h2 className="text-lg font-bold p-5 border-b border-[var(--beige)] flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-[#9C6644]" /> بيانات العميل
            </h2>
            <div className="p-5 text-sm space-y-4">
              <div>
                <div className="opacity-60 mb-1">الاسم:</div>
                <div className="font-bold">{order.customer_name}</div>
              </div>
              <div>
                <div className="opacity-60 mb-1">الهاتف:</div>
                <div className="font-bold font-en">{order.customer_phone}</div>
                <a href={`https://wa.me/965${order.customer_phone}`} target="_blank" className="text-xs text-green-600 mt-1 inline-block font-bold">💬 مراسلة واتساب</a>
              </div>
              {order.customer_email && (
                <div>
                  <div className="opacity-60 mb-1">البريد:</div>
                  <div className="font-bold font-en">{order.customer_email}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[var(--beige)]">
            <h2 className="text-lg font-bold p-5 border-b border-[var(--beige)] flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-[#9C6644]" /> عنوان التوصيل
            </h2>
            <div className="p-5 text-sm space-y-4 leading-relaxed">
              <div className="font-bold">{order.address_area}</div>
              <div>
                قطعة {order.address_block}، شارع {order.address_street}<br/>
                منزل {order.address_house}
              </div>
              {order.notes && (
                <div className="p-3 bg-gray-50 rounded-lg mt-3 border border-gray-100">
                  <div className="text-xs font-bold opacity-60 mb-1">ملاحظات:</div>
                  <div>{order.notes}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[var(--beige)] p-5">
             <div className="text-sm font-bold opacity-60 mb-2">طريقة الدفع</div>
             <div className="font-bold">
               {order.payment_method === 'cod' ? '💵 دفع عند الاستلام کـاش' : '💳 دفع إلكتروني'}
             </div>
             <div className={`mt-2 badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-gray'}`}>
                {order.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
             </div>
          </div>

        </div>

      </div>
    </div>
  )
}

function ShoppingBagIcon(props: any) {
  return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
}
