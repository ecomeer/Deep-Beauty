'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

interface Settings {
  store_name: string
  whatsapp_number: string
  instagram_url: string
  tiktok_url: string
  snapchat_url: string
  announcement_text: string
  exchange_rate_sar: string
  exchange_rate_aed: string
  exchange_rate_qar: string
  exchange_rate_bhd: string
  exchange_rate_omr: string
  loyalty_kwd_per_point: string
}

const DEFAULTS: Settings = {
  store_name: 'Deep Beauty',
  whatsapp_number: '96522289182',
  instagram_url: 'https://instagram.com/deepbeautykw',
  tiktok_url: '',
  snapchat_url: '',
  announcement_text: '🚚 شحن مجاني للطلبات فوق ٢٠ د.ك',
  // Fallback values mirror EXCHANGE_RATES in lib/currency.ts
  exchange_rate_sar: '12.25',
  exchange_rate_aed: '11.95',
  exchange_rate_qar: '11.85',
  exchange_rate_bhd: '1.23',
  exchange_rate_omr: '1.26',
  loyalty_kwd_per_point: '0.01',
}

const EXCHANGE_RATE_FIELDS: Array<{ name: keyof Settings; label: string }> = [
  { name: 'exchange_rate_sar', label: 'ريال سعودي (SAR)' },
  { name: 'exchange_rate_aed', label: 'درهم إماراتي (AED)' },
  { name: 'exchange_rate_qar', label: 'ريال قطري (QAR)' },
  { name: 'exchange_rate_bhd', label: 'دينار بحريني (BHD)' },
  { name: 'exchange_rate_omr', label: 'ريال عماني (OMR)' },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/admin/settings')
    if (res.ok) {
      const data = await res.json()
      const rows: { key: string; value: string | null }[] = data.settings || []
      if (rows.length > 0) {
        const map: Partial<Settings> = {}
        rows.forEach(({ key, value }) => {
          if (key in DEFAULTS) {
            (map as Record<string, string>)[key] = value ?? ''
          }
        })
        setSettings({ ...DEFAULTS, ...map })
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (!res.ok) {
      const { error } = await res.json()
      toast.error('حدث خطأ أثناء الحفظ: ' + error)
    } else {
      toast.success('تم حفظ الإعدادات بنجاح ✓')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex h-40 items-center justify-center">
      <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-dark)]">الإعدادات</h1>
        <p className="text-sm opacity-60">إعدادات المتجر العامة</p>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-base font-bold border-b pb-3" style={{ borderColor: 'var(--beige)', color: 'var(--text-dark)' }}>معلومات المتجر</h2>

          <div>
            <label className="block text-sm font-bold mb-1.5">اسم المتجر</label>
            <input name="store_name" value={settings.store_name} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5">نص الإعلان (الشريط العلوي)</label>
            <input name="announcement_text" value={settings.announcement_text} onChange={handleChange} className="input-field" />
          </div>

          <div className="rounded-xl p-3 bg-amber-50 border border-amber-200 text-xs text-amber-700">
            ⚠️ إعدادات الشحن تُدار من صفحة <a href="/admin/shipping" className="font-bold underline">الشحن</a> — التعديل هنا لا يؤثر على حساب تكلفة التوصيل عند الـ Checkout.
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-base font-bold border-b pb-3" style={{ borderColor: 'var(--beige)', color: 'var(--text-dark)' }}>وسائل التواصل</h2>

          <div>
            <label className="block text-sm font-bold mb-1.5">رقم واتساب الدعم</label>
            <input name="whatsapp_number" value={settings.whatsapp_number} onChange={handleChange} className="input-field" dir="ltr" placeholder="96522289182" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5">رابط انستجرام</label>
            <input name="instagram_url" value={settings.instagram_url} onChange={handleChange} className="input-field" dir="ltr" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5">رابط تيك توك</label>
            <input name="tiktok_url" value={settings.tiktok_url} onChange={handleChange} className="input-field" dir="ltr" placeholder="https://tiktok.com/@deepbeautykw" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5">رابط سناب شات</label>
            <input name="snapchat_url" value={settings.snapchat_url} onChange={handleChange} className="input-field" dir="ltr" placeholder="https://snapchat.com/add/deepbeautykw" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-base font-bold border-b pb-3" style={{ borderColor: 'var(--beige)', color: 'var(--text-dark)' }}>أسعار الصرف (مقابل 1 دينار كويتي)</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EXCHANGE_RATE_FIELDS.map(({ name, label }) => (
              <div key={name}>
                <label className="block text-sm font-bold mb-1.5">{label}</label>
                <input
                  name={name}
                  type="number"
                  step="0.001"
                  min="0"
                  value={settings[name]}
                  onChange={handleChange}
                  className="input-field"
                  dir="ltr"
                />
              </div>
            ))}
          </div>

          <div className="rounded-xl p-3 bg-blue-50 border border-blue-200 text-xs text-blue-700">
            💡 تُستخدم لعرض الأسعار بعملة الزائر في المتجر. الدفع الفعلي يتم بالدينار الكويتي. التعديل يسري خلال دقائق.
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-base font-bold border-b pb-3" style={{ borderColor: 'var(--beige)', color: 'var(--text-dark)' }}>نقاط الولاء</h2>

          <div>
            <label className="block text-sm font-bold mb-1.5">قيمة النقطة الواحدة (بالدينار الكويتي)</label>
            <input
              name="loyalty_kwd_per_point"
              type="number"
              step="0.001"
              min="0.001"
              value={settings.loyalty_kwd_per_point}
              onChange={handleChange}
              className="input-field"
              dir="ltr"
            />
          </div>

          <div className="rounded-xl p-3 bg-blue-50 border border-blue-200 text-xs text-blue-700">
            💡 العملاء المسجلون يكسبون نقطة واحدة عن كل دينار يُنفق، ويقدرون يستبدلونها عند الدفع بهذا السعر. مثال: 0.01 يعني 100 نقطة = 1 د.ك خصم.
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-4 font-bold text-base disabled:opacity-50">
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات ✓'}
        </button>
      </form>
    </div>
  )
}
