'use client'

import { useState, useEffect } from 'react'
import { formatDateTime } from '@/lib/utils'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    code: '', type: 'percentage', value: 0,
    min_order_amount: 0, usage_limit: '', expires_at: ''
  })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchCoupons()
  }, [])

  async function fetchCoupons() {
    const res = await fetch('/api/admin/coupons')
    const data = await res.json()
    setCoupons(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل متأكد من الحذف؟')) return
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
    fetchCoupons()
    toast.success('تم الحذف')
  }

  const toggleStatus = async (id: string, current: boolean) => {
    await fetch(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    fetchCoupons()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code || form.value <= 0) return toast.error('أكمل البيانات المطلوبة')

    setAdding(true)
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code.toUpperCase(),
        type: form.type,
        value: form.value,
        min_order_amount: form.min_order_amount,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      }),
    })

    if (!res.ok) { const d = await res.json(); toast.error(d.error || 'حدث خطأ') }
    else {
      toast.success('تم الإضافة')
      setForm({ code: '', type: 'percentage', value: 0, min_order_amount: 0, usage_limit: '', expires_at: '' })
      fetchCoupons()
    }
    setAdding(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>الكوبونات والخصومات</h1>
        <p className="text-sm opacity-60">إدارة أكواد الخصم الترويجية</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--beige)' }}>
            <h2 className="text-lg font-bold mb-4">إنشاء كوبون جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1">الكود *</label>
                <input required value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="input-field" dir="ltr" placeholder="SUMMER24" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">النوع</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field">
                    <option value="percentage">نسبة مئوية %</option>
                    <option value="fixed">مبلغ ثابت (د.ك)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">قيمة الخصم *</label>
                  <input required type="number" step={form.type === 'fixed' ? '0.001' : '1'} value={form.value} onChange={e => setForm({...form, value: Number(e.target.value)})} className="input-field" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block mb-1">الحد الأدنى للطلب (د.ك)</label>
                <input type="number" step="0.001" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: Number(e.target.value)})} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block mb-1">حد الاستخدام (مرات - اختياري)</label>
                <input type="number" value={form.usage_limit} onChange={e => setForm({...form, usage_limit: e.target.value})} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block mb-1">تاريخ الانتهاء (اختياري)</label>
                <input type="date" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} className="input-field" dir="ltr" />
              </div>
              <button disabled={adding} type="submit" className="btn-primary w-full py-3 flex justify-center gap-2">
                <PlusIcon className="w-5 h-5" /> إضافة الكوبون
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
          <div className="overflow-x-auto">
            <table className="admin-table text-sm">
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>الخصم</th>
                  <th>الحد الأدنى</th>
                  <th>استخدم</th>
                  <th>انتهاء</th>
                  <th>الحالة</th>
                  <th>حذف</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={7} className="p-4 text-center">جاري التحميل...</td></tr> : coupons.length === 0 ? <tr><td colSpan={7} className="p-4 text-center">لا توجد كوبونات</td></tr> : coupons.map(c => (
                  <tr key={c.id}>
                    <td className="font-bold text-[#9C6644] font-en">{c.code}</td>
                    <td>{c.type === 'percentage' ? `${c.value}%` : `${c.value} د.ك`}</td>
                    <td>{c.min_order_amount > 0 ? `${c.min_order_amount} د.ك` : 'لا يوجد'}</td>
                    <td>{c.usage_count} {c.usage_limit && `/ ${c.usage_limit}`}</td>
                    <td className="font-en" dir="ltr">{c.expires_at ? formatDateTime(c.expires_at).split(',')[0] : 'أبداً'}</td>
                    <td>
                      <button onClick={() => toggleStatus(c.id, c.is_active)} className={`badge ${c.is_active ? 'badge-success' : 'badge-gray'}`}>
                        {c.is_active ? 'نشط' : 'معطل'}
                      </button>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
