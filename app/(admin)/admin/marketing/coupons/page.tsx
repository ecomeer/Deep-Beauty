'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

interface Coupon {
  id: string
  code: string
  description_ar: string | null
  type: 'percentage' | 'fixed'
  value: number
  min_order_amount: number
  usage_limit: number | null
  usage_count: number
  is_active: boolean
  expires_at: string | null
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    const res = await fetch('/api/admin/coupons')
    const data = await res.json()
    setCoupons(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    if (res.ok) {
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
    }
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCoupons(prev => prev.filter(c => c.id !== id))
      toast.success('تم الحذف')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/marketing" className="text-sm opacity-60 hover:opacity-100">التسويق</Link>
        <ArrowRightIcon className="w-4 h-4 opacity-40" />
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>كوبونات الخصم</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="font-bold" style={{ color: 'var(--text-dark)' }}>الكوبونات ({coupons.length})</h2>
          <Link href="/admin/marketing/coupons/new" className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> كوبون جديد
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 opacity-50">
            <div className="text-4xl mb-3">🎟️</div>
            <p>لا توجد كوبونات بعد</p>
            <Link href="/admin/marketing/coupons/new" className="btn-primary mt-4 inline-block px-6 py-2">
              إضافة كوبون
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs opacity-50 border-b" style={{ borderColor: 'var(--beige)' }}>
                  <th className="px-5 py-3 font-medium">الكود</th>
                  <th className="px-5 py-3 font-medium">الخصم</th>
                  <th className="px-5 py-3 font-medium">الاستخدام</th>
                  <th className="px-5 py-3 font-medium">الانتهاء</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                  <th className="px-5 py-3 font-medium">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => (
                  <tr key={coupon.id} className="border-b last:border-0 hover:bg-gray-50" style={{ borderColor: 'var(--beige)' }}>
                    <td className="px-5 py-4">
                      <div className="font-bold font-mono" style={{ color: 'var(--primary)' }}>{coupon.code}</div>
                      {coupon.description_ar && <div className="text-xs opacity-50">{coupon.description_ar}</div>}
                    </td>
                    <td className="px-5 py-4">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value.toFixed(3)} د.ك`}
                      {coupon.min_order_amount > 0 && <div className="text-xs opacity-50">حد أدنى: {coupon.min_order_amount.toFixed(3)} د.ك</div>}
                    </td>
                    <td className="px-5 py-4">
                      {coupon.usage_count} / {coupon.usage_limit || '∞'}
                    </td>
                    <td className="px-5 py-4 opacity-60 text-xs">
                      {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('ar-KW') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(coupon.id, coupon.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {coupon.is_active ? 'فعّال' : 'معطّل'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => deleteCoupon(coupon.id)} className="text-red-400 hover:text-red-600 text-xs">
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
