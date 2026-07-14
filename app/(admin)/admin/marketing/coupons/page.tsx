'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { PlusIcon, ArrowRightIcon, TagIcon } from '@heroicons/react/24/outline'
import { toArabicPrice, formatDate } from '@/lib/utils'
import { useAdminList } from '@/hooks/useAdminList'

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
  const { items: coupons, setItems: setCoupons, loading } = useAdminList<Coupon>(
    '/api/admin/coupons',
    (json) => (Array.isArray(json) ? (json as Coupon[]) : [])
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkApplying, setBulkApplying] = useState(false)

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    if (!res.ok) { toast.error('حدث خطأ أثناء التحديث'); return }
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('حدث خطأ أثناء الحذف'); return }
    setCoupons(prev => prev.filter(c => c.id !== id))
    toast.success('تم الحذف')
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(prev => prev.size === coupons.length ? new Set() : new Set(coupons.map(c => c.id)))
  }

  async function bulkSetActive(isActive: boolean) {
    if (selectedIds.size === 0) return
    setBulkApplying(true)
    const results = await Promise.all(
      Array.from(selectedIds).map(id =>
        fetch(`/api/admin/coupons/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: isActive }),
        })
      )
    )
    setBulkApplying(false)
    if (results.some(r => !r.ok)) toast.error('فشل تحديث بعض الكوبونات')
    else toast.success('تم التحديث')
    setCoupons(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, is_active: isActive } : c))
    setSelectedIds(new Set())
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/marketing" className="text-sm opacity-60 hover:opacity-100">التسويق</Link>
        <ArrowRightIcon className="w-4 h-4 opacity-40" />
        <h1 className="text-xl font-bold text-[var(--text-dark)]">كوبونات الخصم</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="font-bold text-[var(--text-dark)]">الكوبونات ({coupons.length})</h2>
          <Link href="/admin/marketing/coupons/new" className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> كوبون جديد
          </Link>
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 p-3 border-b bg-amber-50" style={{ borderColor: 'var(--beige)' }}>
            <span className="text-sm font-bold">{selectedIds.size} محدد</span>
            <button type="button" onClick={() => bulkSetActive(true)} disabled={bulkApplying} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-50">تفعيل</button>
            <button type="button" onClick={() => bulkSetActive(false)} disabled={bulkApplying} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-50">تعطيل</button>
            <button type="button" onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-500 hover:text-gray-700">إلغاء التحديد</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <TagIcon className="w-12 h-12 opacity-20" />
            <p className="text-sm opacity-50">لا توجد كوبونات بعد</p>
            <Link href="/admin/marketing/coupons/new" className="btn-primary mt-1 inline-block px-6 py-2">
              إضافة كوبون
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="w-8">
                      <input
                        type="checkbox"
                        checked={coupons.length > 0 && selectedIds.size === coupons.length}
                        onChange={toggleSelectAll}
                        title="تحديد الكل"
                      />
                    </th>
                    <th>الكود</th>
                    <th>الخصم</th>
                    <th>الاستخدام</th>
                    <th>الانتهاء</th>
                    <th>الحالة</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(coupon => (
                    <tr key={coupon.id}>
                      <td>
                        <input type="checkbox" checked={selectedIds.has(coupon.id)} onChange={() => toggleSelect(coupon.id)} title="تحديد" />
                      </td>
                      <td>
                        <div className="font-bold font-mono text-primary">{coupon.code}</div>
                        {coupon.description_ar && <div className="text-xs opacity-50">{coupon.description_ar}</div>}
                      </td>
                      <td>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : toArabicPrice(coupon.value)}
                        {coupon.min_order_amount > 0 && <div className="text-xs opacity-50">حد أدنى: {toArabicPrice(coupon.min_order_amount)}</div>}
                      </td>
                      <td>{coupon.usage_count} / {coupon.usage_limit || '∞'}</td>
                      <td className="opacity-60 text-xs">{coupon.expires_at ? formatDate(coupon.expires_at) : '—'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleActive(coupon.id, coupon.is_active)}
                          className={`badge ${coupon.is_active ? 'badge-success' : 'badge-gray'} hover:opacity-80 transition-opacity cursor-pointer`}
                        >
                          {coupon.is_active ? 'فعّال' : 'معطّل'}
                        </button>
                      </td>
                      <td>
                        <button type="button" onClick={() => deleteCoupon(coupon.id)} title="حذف الكوبون" aria-label="حذف الكوبون" className="text-red-400 hover:text-red-600 text-xs">
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {coupons.map(coupon => (
                <div key={coupon.id} className="border rounded-xl p-4" style={{ borderColor: 'var(--beige)' }}>
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="font-bold font-mono text-primary">{coupon.code}</div>
                      {coupon.description_ar && <div className="text-xs opacity-50">{coupon.description_ar}</div>}
                    </div>
                    <input type="checkbox" checked={selectedIds.has(coupon.id)} onChange={() => toggleSelect(coupon.id)} title="تحديد" className="flex-shrink-0" />
                  </div>
                  <div className="text-sm mb-2">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : toArabicPrice(coupon.value)}
                    {coupon.min_order_amount > 0 && <span className="text-xs opacity-50"> · حد أدنى: {toArabicPrice(coupon.min_order_amount)}</span>}
                  </div>
                  <div className="flex justify-between items-center text-xs opacity-60 mb-3">
                    <span>الاستخدام: {coupon.usage_count} / {coupon.usage_limit || '∞'}</span>
                    <span>{coupon.expires_at ? formatDate(coupon.expires_at) : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(coupon.id, coupon.is_active)}
                      className={`flex-1 badge ${coupon.is_active ? 'badge-success' : 'badge-gray'} py-2 text-sm cursor-pointer`}
                    >
                      {coupon.is_active ? 'فعّال' : 'معطّل'}
                    </button>
                    <button type="button" onClick={() => deleteCoupon(coupon.id)} title="حذف الكوبون" aria-label="حذف الكوبون" className="p-2 rounded-lg hover:bg-red-50 text-red-500 text-xs">
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
