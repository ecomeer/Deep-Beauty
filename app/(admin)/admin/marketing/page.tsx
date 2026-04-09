'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface CouponRow {
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

export default function AdminMarketing() {
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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

  const fetchCoupons = () => {
    supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }: { data: CouponRow[] | null }) => {
        if (data) setCoupons(data)
        setLoading(false)
      }, () => setLoading(false))
  }

  useEffect(() => { fetchCoupons() }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.value) return
    setSaving(true)
    const { error } = await supabase.from('coupons').insert({
      code: form.code.trim().toUpperCase(),
      description_ar: form.description_ar || null,
      type: form.type,
      value: parseFloat(form.value),
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      expires_at: form.expires_at || null,
      is_active: true,
    })
    setSaving(false)
    if (error) { toast.error('حدث خطأ أثناء الحفظ'); return }
    toast.success('تم إضافة الكوبون')
    setShowForm(false)
    setForm({ code: '', description_ar: '', type: 'percentage', value: '', min_order_amount: '0', usage_limit: '', expires_at: '' })
    fetchCoupons()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('coupons').update({ is_active: !current }).eq('id', id)
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, is_active: !current } : c))
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    await supabase.from('coupons').delete().eq('id', id)
    setCoupons((prev) => prev.filter((c) => c.id !== id))
    toast.success('تم الحذف')
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>التسويق</h1>
          <p className="text-sm opacity-60">إدارة كوبونات الخصم والحملات الترويجية</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary px-5 py-2.5 text-sm">
          {showForm ? '✕ إلغاء' : '+ كوبون جديد'}
        </button>
      </div>

      {/* Add Coupon Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 mb-8" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-lg font-bold mb-5" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-dark)' }}>إضافة كوبون خصم</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">كود الخصم *</label>
              <input name="code" value={form.code} onChange={handleChange} required className="input-field" placeholder="SUMMER20" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">وصف (اختياري)</label>
              <input name="description_ar" value={form.description_ar} onChange={handleChange} className="input-field" placeholder="خصم الصيف" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">نوع الخصم *</label>
              <select name="type" value={form.type} onChange={handleChange} className="input-field" aria-label="نوع الخصم" title="نوع الخصم">
                <option value="percentage">نسبة مئوية %</option>
                <option value="fixed">مبلغ ثابت (د.ك)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">قيمة الخصم *</label>
              <input name="value" type="number" min="0" step="any" value={form.value} onChange={handleChange} required className="input-field" placeholder={form.type === 'percentage' ? '20' : '2.000'} dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الحد الأدنى للطلب (د.ك)</label>
              <input name="min_order_amount" type="number" min="0" step="any" value={form.min_order_amount} onChange={handleChange} className="input-field" placeholder="0" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الحد الأقصى للاستخدام</label>
              <input name="usage_limit" type="number" min="1" value={form.usage_limit} onChange={handleChange} className="input-field" placeholder="غير محدود" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">تاريخ الانتهاء</label>
              <input name="expires_at" type="datetime-local" value={form.expires_at} onChange={handleChange} className="input-field" dir="ltr" aria-label="تاريخ الانتهاء" title="تاريخ الانتهاء" />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ الكوبون'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline px-6 py-2.5 text-sm">إلغاء</button>
          </div>
        </form>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="font-bold" style={{ color: 'var(--text-dark)' }}>كوبونات الخصم ({coupons.length})</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 opacity-50">
            <div className="text-4xl mb-3">🎟️</div>
            <p>لا توجد كوبونات بعد</p>
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
                  <th className="px-5 py-3 font-medium sr-only">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--beige)' }}>
                    <td className="px-5 py-4">
                      <div className="font-bold font-mono" style={{ color: 'var(--primary)', direction: 'ltr' }}>{coupon.code}</div>
                      {coupon.description_ar && <div className="text-xs opacity-50 mt-0.5">{coupon.description_ar}</div>}
                    </td>
                    <td className="px-5 py-4">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value.toFixed(3)} د.ك`}
                      {coupon.min_order_amount > 0 && (
                        <div className="text-xs opacity-50">حد أدنى: {coupon.min_order_amount.toFixed(3)} د.ك</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {coupon.usage_count}
                      {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' / ∞'}
                    </td>
                    <td className="px-5 py-4 opacity-60 text-xs">
                      {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('ar-KW') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(coupon.id, coupon.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          coupon.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {coupon.is_active ? 'فعّال' : 'معطّل'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => deleteCoupon(coupon.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
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

      {/* Coming Soon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-lg font-bold mb-2">رسائل الواتساب 💬</h2>
          <p className="text-sm opacity-60 mb-6">إرسال تنبيهات العروض للعملاء وتذكير السلات المتروكة.</p>
          <button disabled className="btn-outline w-full opacity-50 cursor-not-allowed">قريباً</button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-lg font-bold mb-2">النوافذ المنبثقة 🌟</h2>
          <p className="text-sm opacity-60 mb-6">إعداد رسائل ترحيبية أو عروض خاصة تظهر عند دخول المتجر.</p>
          <button disabled className="btn-outline w-full opacity-50 cursor-not-allowed">قريباً</button>
        </div>
      </div>
    </div>
  )
}
