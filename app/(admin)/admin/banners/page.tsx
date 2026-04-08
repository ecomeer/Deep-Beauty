'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TrashIcon, PhotoIcon, ChevronUpIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Banner {
  id: string
  title_ar: string
  subtitle_ar: string | null
  image_url: string
  link_url: string
  is_active: boolean
  sort_order: number
}

const EMPTY_FORM = { title_ar: '', subtitle_ar: '', image_url: '', link_url: '/products' }

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchBanners() }, [])

  async function fetchBanners() {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true })
    setBanners(data || [])
    setLoading(false)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
    if (error) {
      toast.error('فشل رفع الصورة: ' + error.message)
    } else {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setForm(f => ({ ...f, image_url: data.publicUrl }))
      toast.success('تم رفع الصورة')
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title_ar || !form.image_url) return toast.error('العنوان والصورة مطلوبان')
    setSaving(true)
    const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) + 1 : 0
    const res = await fetch('/api/admin/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title_ar: form.title_ar.trim(),
        subtitle_ar: form.subtitle_ar.trim() || null,
        image_url: form.image_url,
        link_url: form.link_url || '/products',
        is_active: true,
        sort_order: maxOrder,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const { error } = await res.json()
      toast.error('حدث خطأ: ' + error)
      return
    }
    toast.success('تم إضافة البنر')
    setForm(EMPTY_FORM)
    setShowForm(false)
    fetchBanners()
  }

  async function toggleActive(banner: Banner) {
    const res = await fetch(`/api/admin/banners/${banner.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...banner, is_active: !banner.is_active }),
    })
    if (res.ok) setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: !banner.is_active } : b))
    else toast.error('حدث خطأ')
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا البنر؟')) return
    const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('حدث خطأ أثناء الحذف'); return }
    toast.success('تم الحذف')
    setBanners(prev => prev.filter(b => b.id !== id))
  }

  async function moveOrder(id: string, dir: 'up' | 'down') {
    const idx = banners.findIndex(b => b.id === id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= banners.length) return

    const a = banners[idx]
    const b = banners[swapIdx]

    await Promise.all([
      fetch(`/api/admin/banners/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...a, sort_order: b.sort_order }),
      }),
      fetch(`/api/admin/banners/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...b, sort_order: a.sort_order }),
      }),
    ])
    fetchBanners()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>البنرات الإعلانية</h1>
          <p className="text-sm opacity-60">إدارة صور الهيرو والبنرات الترويجية ({banners.length})</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> {showForm ? 'إلغاء' : 'بنر جديد'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-base font-bold mb-5" style={{ color: 'var(--text-dark)' }}>إضافة بنر جديد</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">العنوان الرئيسي *</label>
                <input
                  required value={form.title_ar}
                  onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))}
                  className="input-field" placeholder="مثال: عروض الصيف الذهبية"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">العنوان الفرعي</label>
                <input
                  value={form.subtitle_ar}
                  onChange={e => setForm(f => ({ ...f, subtitle_ar: e.target.value }))}
                  className="input-field" placeholder="مثال: خصم حتى ٣٠٪"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">رابط الزر</label>
                <input
                  value={form.link_url}
                  onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                  className="input-field" dir="ltr" placeholder="/products"
                />
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium mb-2">صورة البنر *</label>
              {form.image_url ? (
                <div className="relative rounded-xl overflow-hidden mb-3" style={{ height: 200 }}>
                  <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow text-red-500 text-xs font-bold"
                  >✕ تغيير</button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:border-[var(--primary)] transition-colors" style={{ borderColor: 'var(--dark-beige)' }}>
                  <PhotoIcon className="w-10 h-10 opacity-30" />
                  <span className="text-sm opacity-60">{uploading ? 'جاري الرفع...' : 'اضغط لرفع صورة البنر'}</span>
                  <span className="text-xs opacity-40">PNG, JPG, WEBP — يُفضل ١٩٢٠×٦٠٠</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="sr-only" title="رفع صورة البنر" />
                </label>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving || uploading} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
                {saving ? 'جاري الحفظ...' : 'حفظ البنر'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }} className="btn-outline px-6 py-2.5 text-sm">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Banners List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: 'var(--beige)' }}>
          <PhotoIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm opacity-50">لا توجد بنرات بعد — أضف أول بنر</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, idx) => (
            <div key={banner.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
              <div className="flex items-center gap-4 p-4">
                {/* Thumbnail */}
                <div className="w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  <img src={banner.image_url} alt={banner.title_ar} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-dark)' }}>{banner.title_ar}</h3>
                  {banner.subtitle_ar && <p className="text-xs opacity-60 mt-0.5 truncate">{banner.subtitle_ar}</p>}
                  <p className="text-xs opacity-40 mt-1 font-en" dir="ltr">{banner.link_url}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Reorder */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveOrder(banner.id, 'up')}
                      disabled={idx === 0}
                      title="تحريك للأعلى"
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 transition-colors"
                    >
                      <ChevronUpIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveOrder(banner.id, 'down')}
                      disabled={idx === banners.length - 1}
                      title="تحريك للأسفل"
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 transition-colors"
                    >
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleActive(banner)}
                    className={`badge cursor-pointer hover:opacity-80 ${banner.is_active ? 'badge-success' : 'badge-gray'}`}
                  >
                    {banner.is_active ? 'نشط' : 'معطل'}
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(banner.id)}
                    title="حذف البنر"
                    className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
