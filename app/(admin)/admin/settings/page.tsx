'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface Settings {
  store_name: string
  shipping_cost: string
  free_shipping_above: string
  whatsapp_number: string
  instagram_url: string
  tiktok_url: string
  snapchat_url: string
  announcement_text: string
}

const DEFAULTS: Settings = {
  store_name: 'Deep Beauty',
  shipping_cost: '1.500',
  free_shipping_above: '20.000',
  whatsapp_number: '96522289182',
  instagram_url: 'https://instagram.com/deepbeautykw',
  tiktok_url: '',
  snapchat_url: '',
  announcement_text: '🚚 شحن مجاني للطلبات فوق ٢٠ د.ك',
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
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
  }

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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>الإعدادات</h1>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5">رسوم التوصيل (د.ك)</label>
              <input name="shipping_cost" value={settings.shipping_cost} onChange={handleChange} className="input-field" dir="ltr" placeholder="1.500" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5">شحن مجاني فوق (د.ك)</label>
              <input name="free_shipping_above" value={settings.free_shipping_above} onChange={handleChange} className="input-field" dir="ltr" placeholder="20.000" />
            </div>
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

        <button type="submit" disabled={saving} className="btn-primary w-full py-4 font-bold text-base disabled:opacity-50">
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات ✓'}
        </button>
      </form>
    </div>
  )
}
