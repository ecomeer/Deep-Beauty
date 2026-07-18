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
  meta_pixel_id: string
  snap_pixel_id: string
  gtm_id: string
  instagram_images: string
  welcome_popup_enabled: string
  welcome_coupon_code: string
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
  meta_pixel_id: '',
  snap_pixel_id: '',
  gtm_id: '',
  instagram_images: '[]',
  welcome_popup_enabled: 'true',
  welcome_coupon_code: 'WELCOME10',
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

  // ── Instagram grid images (stored as JSON in the instagram_images setting) ──
  const igImages: { image_url: string; link_url?: string }[] = (() => {
    try {
      const parsed = JSON.parse(settings.instagram_images || '[]')
      return Array.isArray(parsed) ? parsed.slice(0, 6) : []
    } catch { return [] }
  })()
  const [igUploading, setIgUploading] = useState(false)

  const setIgImages = (items: { image_url: string; link_url?: string }[]) =>
    setSettings((prev) => ({ ...prev, instagram_images: JSON.stringify(items.slice(0, 6)) }))

  const handleIgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || igImages.length >= 6) return
    setIgUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'instagram')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.url) throw new Error(json.error || 'فشل الرفع')
      setIgImages([...igImages, { image_url: json.url }])
      toast.success('تم رفع الصورة — لا تنسي حفظ الإعدادات')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل رفع الصورة')
    }
    setIgUploading(false)
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5">نافذة خصم أول طلب</label>
              <select
                name="welcome_popup_enabled"
                value={settings.welcome_popup_enabled}
                onChange={(e) => setSettings({ ...settings, welcome_popup_enabled: e.target.value })}
                className="input-field"
              >
                <option value="true">مفعّلة</option>
                <option value="false">معطّلة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5">كود خصم الترحيب</label>
              <input name="welcome_coupon_code" value={settings.welcome_coupon_code} onChange={handleChange} className="input-field" dir="ltr" placeholder="WELCOME10" />
            </div>
          </div>

          <div className="rounded-xl p-3 bg-blue-50 border border-blue-200 text-xs text-blue-700">
            💡 تأكدي من إنشاء كوبون فعلي بنفس الكود من صفحة الكوبونات حتى يعمل الخصم عند الدفع.
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

        <div className="bg-white rounded-2xl shadow-sm border border-beige p-6 space-y-5">
          <h2 className="text-base font-bold border-b border-beige pb-3 text-on-surface">صور قسم إنستغرام (الصفحة الرئيسية)</h2>

          <p className="text-xs text-on-surface-variant">
            حتى ٦ صور تظهر في قسم «الأكثر رواجاً على إنستغرام». يمكن إضافة رابط منشور لكل صورة، وإلا يُستخدم رابط الحساب.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {igImages.map((img, i) => (
              <div key={img.image_url} className="space-y-1.5">
                <div className="relative aspect-square rounded-xl overflow-hidden border border-beige group">
                  <img src={img.image_url} alt={`صورة إنستغرام ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    aria-label="حذف الصورة"
                    onClick={() => setIgImages(igImages.filter((_, j) => j !== i))}
                    className="absolute top-1.5 start-1.5 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
                <input
                  value={img.link_url || ''}
                  onChange={(e) => setIgImages(igImages.map((it, j) => j === i ? { ...it, link_url: e.target.value } : it))}
                  className="input-field !py-1.5 !text-xs"
                  dir="ltr"
                  placeholder="رابط المنشور (اختياري)"
                />
              </div>
            ))}

            {igImages.length < 6 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-dark-beige flex flex-col items-center justify-center gap-1 cursor-pointer text-on-surface-variant hover:border-primary hover:text-primary transition-colors text-xs font-bold">
                {igUploading ? 'جارٍ الرفع…' : '+ إضافة صورة'}
                <input type="file" accept="image/*" className="sr-only" onChange={handleIgUpload} disabled={igUploading} />
              </label>
            )}
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

        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-base font-bold border-b pb-3" style={{ borderColor: 'var(--beige)', color: 'var(--text-dark)' }}>تتبع وتحليلات (Pixels)</h2>

          <div>
            <label className="block text-sm font-bold mb-1.5">Meta Pixel ID (فيسبوك/انستجرام)</label>
            <input name="meta_pixel_id" value={settings.meta_pixel_id} onChange={handleChange} className="input-field" dir="ltr" placeholder="123456789012345" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5">Snapchat Pixel ID</label>
            <input name="snap_pixel_id" value={settings.snap_pixel_id} onChange={handleChange} className="input-field" dir="ltr" placeholder="00000000-0000-0000-0000-000000000000" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5">Google Tag Manager Container ID</label>
            <input name="gtm_id" value={settings.gtm_id} onChange={handleChange} className="input-field" dir="ltr" placeholder="GTM-XXXXXXX" />
          </div>

          <div className="rounded-xl p-3 bg-blue-50 border border-blue-200 text-xs text-blue-700">
            💡 اترك الحقل فارغاً لتعطيل ذلك البكسل. التفعيل يسري على كل صفحات المتجر خلال دقائق بدون الحاجة لإعادة نشر الموقع.
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-4 font-bold text-base disabled:opacity-50">
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات ✓'}
        </button>
      </form>
    </div>
  )
}
