'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Collection } from '@/types'
import { PhotoIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface ProductOption {
  id: string
  name_ar: string
  images?: string[]
  price: number
}

interface CollectionProductLink {
  id: string
  product_id: string
  sort_order: number
  products: ProductOption | null
}

export default function AdminCollectionDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [collection, setCollection] = useState<Collection | null>(null)
  const [links, setLinks] = useState<CollectionProductLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [allProducts, setAllProducts] = useState<ProductOption[]>([])
  const [productFilter, setProductFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/collections/${id}`)
    if (res.ok) {
      const data = await res.json()
      setCollection(data.collection)
      setLinks(data.products || [])
    } else {
      toast.error('تعذّر تحميل المجموعة')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/admin/products?pageSize=300').then((r) => r.json()).then((d) => setAllProducts(d.products || [])).catch(() => {})
  }, [])

  async function saveField(field: string, value: unknown) {
    if (!collection) return
    setSaving(true)
    const res = await fetch(`/api/admin/collections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('حدث خطأ أثناء الحفظ'); return }
    setCollection((c) => (c ? { ...c, [field]: value } as Collection : c))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'collections')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    if (res.ok) {
      const { url } = await res.json()
      await saveField('image_url', url)
      toast.success('تم رفع الصورة')
    } else {
      toast.error('فشل رفع الصورة')
    }
    setUploading(false)
    e.target.value = ''
  }

  const linkedProductIds = new Set(links.map((l) => l.product_id))
  const availableProducts = allProducts
    .filter((p) => !linkedProductIds.has(p.id))
    .filter((p) => p.name_ar.toLowerCase().includes(productFilter.toLowerCase()))

  async function addProduct(productId: string) {
    const res = await fetch(`/api/admin/collections/${id}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    })
    if (!res.ok) { toast.error('حدث خطأ أثناء الإضافة'); return }
    toast.success('تمت الإضافة')
    load()
  }

  async function removeProduct(linkId: string) {
    const res = await fetch(`/api/admin/collections/${id}/products?linkId=${linkId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('حدث خطأ أثناء الحذف'); return }
    setLinks((prev) => prev.filter((l) => l.id !== linkId))
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= links.length) return
    const reordered = [...links]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setLinks(reordered)
    await fetch(`/api/admin/collections/${id}/products`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: reordered.map((l, i) => ({ id: l.id, sort_order: i })) }),
    })
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!collection) {
    return <p className="text-sm opacity-60">المجموعة غير موجودة.</p>
  }

  return (
    <div>
      <button type="button" onClick={() => router.push('/admin/collections')}
        className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100 mb-4">
        <ArrowRightIcon className="w-4 h-4" /> رجوع للمجموعات
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-dark)]">{collection.name_ar}</h1>
          <p className="text-sm opacity-60">{saving ? 'جاري الحفظ...' : `${links.length} منتج في المجموعة`}</p>
        </div>
        <Link href={`/collections/${collection.slug}`} target="_blank" className="btn-outline px-4 py-2 text-sm">
          معاينة في المتجر
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ borderColor: 'var(--beige)' }}>
        <div>
          <label className="block text-sm font-medium mb-1.5">الاسم بالعربي</label>
          <input defaultValue={collection.name_ar} onBlur={(e) => saveField('name_ar', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">الاسم بالإنجليزي</label>
          <input defaultValue={collection.name_en} onBlur={(e) => saveField('name_en', e.target.value)} className="input-field" dir="ltr" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1.5">الوصف</label>
          <textarea defaultValue={collection.description_ar || ''} onBlur={(e) => saveField('description_ar', e.target.value)} className="input-field" rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">صورة المجموعة</label>
          {collection.image_url ? (
            <div className="flex items-center gap-2">
              <img src={collection.image_url} alt="preview" className="w-10 h-10 rounded-lg object-cover border" />
              <label className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer">
                {uploading ? 'جاري الرفع...' : 'تغيير'}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="sr-only" />
              </label>
            </div>
          ) : (
            <label className="flex items-center gap-2 btn-outline py-2 px-3 text-sm cursor-pointer w-full justify-center">
              <PhotoIcon className="w-4 h-4" />
              {uploading ? 'جاري الرفع...' : 'رفع صورة'}
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="sr-only" />
            </label>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={collection.is_featured} onChange={(e) => saveField('is_featured', e.target.checked)} />
            مجموعة مميزة
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={collection.status === 'active'}
              onChange={(e) => saveField('status', e.target.checked ? 'active' : 'inactive')} />
            نشطة (تظهر بالمتجر)
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-base font-bold mb-4 text-[var(--text-dark)]">منتجات المجموعة</h2>
          {links.length === 0 ? (
            <p className="text-sm opacity-50">لا توجد منتجات في هذه المجموعة بعد.</p>
          ) : (
            <div className="space-y-2">
              {links.map((l, i) => (
                <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg border" style={{ borderColor: 'var(--beige)' }}>
                  {l.products?.images?.[0] && (
                    <img src={l.products.images[0]} alt={l.products.name_ar} className="w-10 h-10 rounded-lg object-cover" />
                  )}
                  <span className="flex-1 text-sm font-medium">{l.products?.name_ar || 'منتج محذوف'}</span>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 disabled:opacity-30" title="نقل لأعلى">
                    <ArrowUpIcon className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === links.length - 1} className="p-1 disabled:opacity-30" title="نقل لأسفل">
                    <ArrowDownIcon className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => removeProduct(l.id)} className="p-1 text-red-400 hover:text-red-600" title="إزالة">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--beige)' }}>
          <h2 className="text-base font-bold mb-4 text-[var(--text-dark)]">إضافة منتجات</h2>
          <input value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="input-field mb-3" placeholder="بحث عن منتج..." />
          <div className="max-h-96 overflow-y-auto space-y-1">
            {availableProducts.map((p) => (
              <button key={p.id} type="button" onClick={() => addProduct(p.id)}
                className="flex items-center gap-2 w-full text-right text-sm p-2 hover:bg-[var(--off-white)] rounded-lg transition-colors">
                {p.images?.[0] && (
                  <img src={p.images[0]} alt={p.name_ar} className="w-8 h-8 rounded-lg object-cover" />
                )}
                <span className="flex-1">{p.name_ar}</span>
                <span className="text-xs opacity-50">+ إضافة</span>
              </button>
            ))}
            {availableProducts.length === 0 && <p className="text-xs opacity-50 p-2">لا توجد منتجات مطابقة</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
