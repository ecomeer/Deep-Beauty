'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Collection } from '@/types'
import { useAdminList } from '@/hooks/useAdminList'
import { PlusIcon, PhotoIcon, TrashIcon, CheckIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

const EMPTY_FORM = { name_ar: '', name_en: '', slug: '', description_ar: '' }

export default function AdminCollections() {
  const { items: collections, setItems: setCollections, loading, refetch } = useAdminList<Collection>(
    '/api/admin/collections',
    (json) => (json as { collections?: Collection[] }).collections || []
  )
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const handleNameEnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setForm((f) => ({ ...f, name_en: val, slug: slugify(val) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name_ar || !form.name_en || !form.slug) return
    setSaving(true)
    const res = await fetch('/api/admin/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim(),
        slug: form.slug.trim(),
        description_ar: form.description_ar.trim() || null,
        status: 'active',
        sort_order: collections.length,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const { error } = await res.json()
      toast.error(error?.includes('23505') ? 'هذا الـ slug مستخدم بالفعل' : 'حدث خطأ أثناء الحفظ')
      return
    }
    toast.success('تم إضافة المجموعة')
    setForm(EMPTY_FORM)
    setShowForm(false)
    refetch()
  }

  const toggleStatus = async (c: Collection) => {
    const newStatus = c.status === 'active' ? 'inactive' : 'active'
    const res = await fetch(`/api/admin/collections/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) { toast.error('حدث خطأ'); return }
    setCollections((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: newStatus } : x)))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المجموعة؟ ستختفي من المتجر فورًا.')) return
    const res = await fetch(`/api/admin/collections/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('حدث خطأ أثناء الحذف'); return }
    toast.success('تم الحذف')
    setCollections((prev) => prev.filter((c) => c.id !== id))
  }

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= collections.length) return
    const reordered = [...collections]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setCollections(reordered)
    await Promise.all(
      reordered.map((c, i) =>
        fetch(`/api/admin/collections/${c.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: i }),
        })
      )
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-dark)]">المجموعات</h1>
          <p className="text-sm opacity-60">إدارة مجموعات المنتجات ({collections.length})</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> {showForm ? 'إلغاء' : 'مجموعة جديدة'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 mb-8" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-base font-bold mb-5 text-[var(--text-dark)]">إضافة مجموعة جديدة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1.5">الاسم بالعربي *</label>
              <input required value={form.name_ar}
                onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
                className="input-field" placeholder="مجموعة العناية اليومية" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الاسم بالإنجليزي *</label>
              <input required value={form.name_en} onChange={handleNameEnChange} className="input-field" placeholder="Daily Care Collection" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Slug *</label>
              <input required value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="input-field" dir="ltr" placeholder="daily-care-collection" />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium mb-1.5">الوصف</label>
              <textarea value={form.description_ar}
                onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))}
                className="input-field" rows={2} placeholder="وصف مختصر للمجموعة" />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ المجموعة'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }} className="btn-outline px-6 py-2.5 text-sm">إلغاء</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 flex flex-col items-center justify-center gap-3" style={{ borderColor: 'var(--beige)' }}>
          <PhotoIcon className="w-12 h-12 opacity-20" />
          <p className="text-sm opacity-50">لا توجد مجموعات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((c, i) => (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
              <div className="relative h-36 bg-gray-50 flex items-center justify-center">
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name_ar} className="w-full h-full object-cover" />
                ) : (
                  <PhotoIcon className="w-10 h-10 opacity-20" />
                )}
                <span className={`absolute top-2 right-2 badge ${c.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                  {c.status === 'active' ? 'نشطة' : 'معطلة'}
                </span>
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                    className="bg-white/90 rounded-lg p-1 shadow hover:bg-white disabled:opacity-30 transition-colors" title="نقل لأعلى">
                    <ArrowUpIcon className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === collections.length - 1}
                    className="bg-white/90 rounded-lg p-1 shadow hover:bg-white disabled:opacity-30 transition-colors" title="نقل لأسفل">
                    <ArrowDownIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[var(--text-dark)]">{c.name_ar}</h3>
                <p className="text-xs opacity-50 font-en mt-0.5">{c.name_en}</p>
                <p className="text-xs opacity-40 mt-0.5">{c.product_count ?? 0} منتج</p>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--beige)' }}>
                  <Link href={`/admin/collections/${c.id}`}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                    إدارة المنتجات
                  </Link>
                  <button type="button" onClick={() => toggleStatus(c)}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <CheckIcon className="w-3.5 h-3.5" />
                    {c.status === 'active' ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button type="button" onClick={() => handleDelete(c.id)} title="حذف المجموعة"
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
