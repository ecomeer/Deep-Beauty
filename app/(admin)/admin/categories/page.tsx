'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Category } from '@/types'
import { PlusIcon, TrashIcon, PhotoIcon, PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

const EMPTY_FORM = { name_ar: '', name_en: '', slug: '', image_url: '' }

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editUploading, setEditUploading] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })
    setCategories(data || [])
    setLoading(false)
  }

  // Upload image to Supabase Storage
  async function uploadImage(file: File, prefix: string): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `categories/${prefix}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
    if (error) { toast.error('فشل رفع الصورة: ' + error.message); return null }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadImage(file, slugify(form.name_en || 'category'))
    if (url) { setForm(f => ({ ...f, image_url: url })); toast.success('تم رفع الصورة') }
    setUploading(false)
    e.target.value = ''
  }

  async function handleEditImageUpload(e: React.ChangeEvent<HTMLInputElement>, catId: string) {
    const file = e.target.files?.[0]
    if (!file) return
    setEditUploading(true)
    const url = await uploadImage(file, catId)
    if (url) {
      setEditImageUrl(url)
      const cat = categories.find(c => c.id === catId)
      if (cat) {
        await fetch(`/api/admin/categories/${catId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name_ar: cat.name_ar, name_en: cat.name_en, slug: cat.slug, image_url: url, is_active: cat.is_active }),
        })
      }
      setCategories(prev => prev.map(c => c.id === catId ? { ...c, image_url: url } : c))
      toast.success('تم تحديث صورة الفئة')
    }
    setEditUploading(false)
    e.target.value = ''
  }

  const handleNameEnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setForm(f => ({ ...f, name_en: val, slug: slugify(val) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name_ar || !form.name_en || !form.slug) return
    setSaving(true)
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim(),
        slug: form.slug.trim(),
        image_url: form.image_url || null,
        is_active: true,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const { error } = await res.json()
      toast.error(error?.includes('23505') ? 'هذا الـ slug مستخدم بالفعل' : 'حدث خطأ أثناء الحفظ')
      return
    }
    toast.success('تم إضافة الفئة')
    setForm(EMPTY_FORM)
    setShowForm(false)
    fetchCategories()
  }

  const toggleStatus = async (id: string, current: boolean) => {
    const cat = categories.find(c => c.id === id)
    if (!cat) return
    await fetch(`/api/admin/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name_ar: cat.name_ar, name_en: cat.name_en, slug: cat.slug, image_url: cat.image_url || null, is_active: !current }),
    })
    setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('حدث خطأ أثناء الحذف'); return }
    toast.success('تم الحذف')
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditImageUrl(cat.image_url || '')
  }

  const cancelEdit = () => { setEditingId(null); setEditImageUrl('') }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>الفئات</h1>
          <p className="text-sm opacity-60">إدارة تصنيفات المنتجات ({categories.length})</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> {showForm ? 'إلغاء' : 'فئة جديدة'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 mb-8" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-base font-bold mb-5" style={{ color: 'var(--text-dark)' }}>إضافة فئة جديدة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1.5">الاسم بالعربي *</label>
              <input required value={form.name_ar}
                onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
                className="input-field" placeholder="العناية بالوجه" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الاسم بالإنجليزي *</label>
              <input required value={form.name_en}
                onChange={handleNameEnChange}
                className="input-field" placeholder="Face Care" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Slug *</label>
              <input required value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="input-field" dir="ltr" placeholder="face-care" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">صورة الفئة</label>
              {form.image_url ? (
                <div className="flex items-center gap-2">
                  <img src={form.image_url} alt="preview" className="w-10 h-10 rounded-lg object-cover border" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                    className="text-xs text-red-400 hover:text-red-600">إزالة</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 btn-outline py-2 px-3 text-sm cursor-pointer w-full justify-center">
                  <PhotoIcon className="w-4 h-4" />
                  {uploading ? 'جاري الرفع...' : 'رفع صورة'}
                  <input type="file" accept="image/*" onChange={handleImageUpload}
                    disabled={uploading} className="sr-only" title="رفع صورة الفئة" />
                </label>
              )}
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="submit" disabled={saving || uploading} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ الفئة'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }} className="btn-outline px-6 py-2.5 text-sm">إلغاء</button>
          </div>
        </form>
      )}

      {/* Categories Grid */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: 'var(--beige)' }}>
          <p className="text-sm opacity-50">لا توجد فئات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
              {/* Image area */}
              <div className="relative h-36 bg-gray-50 flex items-center justify-center">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name_ar} className="w-full h-full object-cover" />
                ) : (
                  <PhotoIcon className="w-10 h-10 opacity-20" />
                )}

                {/* Upload/change image overlay */}
                {editingId === cat.id ? (
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 cursor-pointer gap-1">
                    <PhotoIcon className="w-7 h-7 text-white" />
                    <span className="text-white text-xs font-bold">
                      {editUploading ? 'جاري الرفع...' : 'اضغط لتغيير الصورة'}
                    </span>
                    <input
                      ref={editInputRef}
                      type="file" accept="image/*"
                      onChange={e => handleEditImageUpload(e, cat.id)}
                      disabled={editUploading}
                      className="sr-only"
                      title="تغيير صورة الفئة"
                    />
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(cat)}
                    title="تعديل الصورة"
                    className="absolute top-2 left-2 bg-white/90 rounded-lg p-1.5 shadow hover:bg-white transition-colors"
                  >
                    <PencilSquareIcon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  </button>
                )}

                {/* Active badge */}
                <span className={`absolute top-2 right-2 badge ${cat.is_active ? 'badge-success' : 'badge-gray'}`}>
                  {cat.is_active ? 'نشطة' : 'معطلة'}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold" style={{ color: 'var(--text-dark)' }}>{cat.name_ar}</h3>
                <p className="text-xs opacity-50 font-en mt-0.5">{cat.name_en}</p>
                <p className="text-xs opacity-40 font-en mt-0.5" dir="ltr">{cat.slug}</p>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--beige)' }}>
                  {editingId === cat.id ? (
                    <button type="button" onClick={cancelEdit}
                      className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      <XMarkIcon className="w-3.5 h-3.5" /> إنهاء
                    </button>
                  ) : (
                    <button type="button" onClick={() => startEdit(cat)}
                      className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                      <PencilSquareIcon className="w-3.5 h-3.5" /> تعديل الصورة
                    </button>
                  )}

                  <button type="button"
                    onClick={() => toggleStatus(cat.id, cat.is_active)}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <CheckIcon className="w-3.5 h-3.5" />
                    {cat.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>

                  <button type="button"
                    onClick={() => handleDelete(cat.id)}
                    title="حذف الفئة"
                    className="mr-auto p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
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
