'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function NewCoupon() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '',
    description_ar: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    min_order_amount: '0',
    usage_limit: '',
    expires_at: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.value) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          description_ar: form.description_ar || null,
          type: form.type,
          value: parseFloat(form.value),
          min_order_amount: parseFloat(form.min_order_amount) || 0,
          usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
          expires_at: form.expires_at || null,
          is_active: true,
        }),
      })

      if (!res.ok) throw new Error('Failed to create')

      toast.success('تم إنشاء الكوبون بنجاح')
      router.push('/admin/marketing/coupons')
    } catch {
      toast.error('حدث خطأ أثناء إنشاء الكوبون')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/marketing/coupons" className="text-sm opacity-60 hover:opacity-100">الكوبونات</Link>
        <ArrowRightIcon className="w-4 h-4 opacity-40" />
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>كوبون جديد</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--beige)' }}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">كود الخصم *</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="input-field"
                placeholder="SUMMER20"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">وصف (اختياري)</label>
              <input
                type="text"
                value={form.description_ar}
                onChange={e => setForm({ ...form, description_ar: e.target.value })}
                className="input-field"
                placeholder="خصم الصيف"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">نوع الخصم *</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as any })}
                className="input-field"
              >
                <option value="percentage">نسبة مئوية %</option>
                <option value="fixed">مبلغ ثابت (د.ك)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">قيمة الخصم *</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.value}
                onChange={e => setForm({ ...form, value: e.target.value })}
                className="input-field"
                placeholder={form.type === 'percentage' ? '20' : '2.000'}
                dir="ltr"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">الحد الأدنى للطلب (د.ك)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.min_order_amount}
                onChange={e => setForm({ ...form, min_order_amount: e.target.value })}
                className="input-field"
                placeholder="0"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الحد الأقصى للاستخدام</label>
              <input
                type="number"
                min="1"
                value={form.usage_limit}
                onChange={e => setForm({ ...form, usage_limit: e.target.value })}
                className="input-field"
                placeholder="غير محدود"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">تاريخ الانتهاء</label>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={e => setForm({ ...form, expires_at: e.target.value })}
              className="input-field"
              dir="ltr"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-3">
            {saving ? 'جاري الحفظ...' : 'إنشاء الكوبون'}
          </button>
          <Link href="/admin/marketing/coupons" className="btn-outline px-6 py-3">
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  )
}
