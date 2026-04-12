'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'
import { Category } from '@/types'
import toast from 'react-hot-toast'

export default function ProductForm() {
  const params = useParams()
  const router = useRouter()
  const isEdit = params?.id !== 'new' && !!params?.id
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  const [form, setForm] = useState({
    name_ar: '', name_en: '', slug: '',
    category: '', price: 0, compare_price: 0,
    stock_quantity: 0, weight_grams: 0,
    is_active: true, is_featured: false,
    description_ar: '', description_en: '',
    ingredients_ar: '', ingredients_en: '',
    images: [] as string[]
  })

  useEffect(() => {
    fetchCategories()
    if (isEdit) fetchProduct()
  }, [isEdit, params])

  async function fetchCategories() {
    const res = await fetch('/api/admin/categories'); const { categories: data } = await res.json()
    setCategories(data || [])
  }

  async function fetchProduct() {
    const res = await fetch(`/api/admin/products/${params.id}`); const { product: data } = await res.json()
    if (data) {
      setForm({
        name_ar: data.name_ar,
        name_en: data.name_en,
        slug: data.slug,
        category: data.category,
        price: data.price,
        compare_price: data.compare_price || 0,
        stock_quantity: data.stock_quantity,
        weight_grams: data.weight_grams || 0,
        is_active: data.is_active,
        is_featured: data.is_featured,
        description_ar: data.description_ar || '',
        description_en: data.description_en || '',
        ingredients_ar: data.ingredients_ar || '',
        ingredients_en: data.ingredients_en || '',
        images: data.images || []
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(value) : value
    
    setForm(prev => {
      const updated = { ...prev, [name]: val }
      // Auto-generate slug from English name if slug is empty or currently editing slug wasn't touched manually
      if (name === 'name_en' && !isEdit) {
        updated.slug = slugify(value as string)
      }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        compare_price: form.compare_price > 0 ? form.compare_price : null,
        weight_grams: form.weight_grams > 0 ? form.weight_grams : null,
      }

      const url = isEdit ? `/api/admin/products/${params.id}` : '/api/admin/products'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || errorData.details || 'حدث خطأ أثناء الحفظ')
      }

      toast.success(isEdit ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح')
      router.push('/admin/products')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ. تأكد أن الـ Slug غير مكرر.')
    }
    setLoading(false)
  }

  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'products')
      const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) { toast.error(`فشل رفع ${file.name}`); continue }
      const { url } = await uploadRes.json()
      uploaded.push(url)
    }
    if (uploaded.length > 0) {
      setForm(f => ({ ...f, images: [...f.images, ...uploaded] }))
      toast.success(`تم رفع ${uploaded.length} صورة بنجاح`)
    }
    setUploading(false)
    e.target.value = ''
  }

  const removeImage = (idx: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>
          {isEdit ? 'تعديل المنتج' : 'إضافة منتج جديد'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--beige)]">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">المعلومات الأساسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">الاسم (عربي) *</label>
              <input name="name_ar" value={form.name_ar} onChange={handleChange} required className="input-field" placeholder="مثال: سيروم الإشراق" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الاسم (إنجليزي) *</label>
              <input name="name_en" value={form.name_en} onChange={handleChange} required className="input-field" dir="ltr" placeholder="e.g. Glow Serum" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الرابط الدائم (Slug) *</label>
              <input name="slug" value={form.slug} onChange={handleChange} required className="input-field" dir="ltr" placeholder="glow-serum" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الفئة</label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field" title="اختر فئة المنتج">
                <option value="">اختر الفئة</option>
                {categories.map(c => <option key={c.id} value={c.name_ar}>{c.name_ar}</option>)}
              </select>
            </div>
            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="accent-[#9C6644] w-4 h-4" />
                <span>المنتج نشط؟</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} className="accent-[#9C6644] w-4 h-4" />
                <span>مميز؟ (يظهر بالرئيسية)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--beige)]">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">التسعير والمخزون</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">السعر (د.ك) *</label>
              <input type="number" step="0.001" name="price" value={form.price} onChange={handleChange} required className="input-field" dir="ltr" placeholder="0.000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">سعر قبل الخصم</label>
              <input type="number" step="0.001" name="compare_price" value={form.compare_price} onChange={handleChange} className="input-field" dir="ltr" placeholder="0.000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الكمية بالمخزون *</label>
              <input type="number" name="stock_quantity" value={form.stock_quantity} onChange={handleChange} required className="input-field" dir="ltr" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الوزن (جرام)</label>
              <input type="number" name="weight_grams" value={form.weight_grams} onChange={handleChange} className="input-field" dir="ltr" placeholder="0" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--beige)]">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">الوصف والمكونات</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">الوصف (عربي)</label>
              <textarea name="description_ar" value={form.description_ar} onChange={handleChange} className="input-field min-h-[100px]" placeholder="وصف تفصيلي للمنتج بالعربية..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الوصف (إنجليزي)</label>
              <textarea name="description_en" value={form.description_en} onChange={handleChange} className="input-field min-h-[100px]" dir="ltr" placeholder="Product description in English..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">المكونات (عربي)</label>
              <textarea name="ingredients_ar" value={form.ingredients_ar} onChange={handleChange} className="input-field min-h-[80px]" placeholder="قائمة المكونات بالعربية..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">المكونات (إنجليزي)</label>
              <textarea name="ingredients_en" value={form.ingredients_en} onChange={handleChange} className="input-field min-h-[80px]" dir="ltr" placeholder="Ingredients list in English..." />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--beige)]">
          <h2 className="text-lg font-bold mb-1 border-b pb-2">صور المنتج</h2>
          <p className="text-xs opacity-50 mb-4">الصورة الأولى هي الصورة الرئيسية. استخدم الأسهم لإعادة الترتيب.</p>

          {form.images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {form.images.map((img, i) => (
                <div key={i} className={`relative rounded-xl border-2 overflow-hidden aspect-square ${i === 0 ? 'border-[var(--primary)]' : 'border-transparent'}`}>
                  <img src={img} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />

                  {/* Primary badge */}
                  {i === 0 && (
                    <span className="absolute bottom-1 right-1 text-[0.6rem] font-bold bg-[var(--primary)] text-white px-1.5 py-0.5 rounded-full">
                      رئيسية
                    </span>
                  )}

                  {/* Controls overlay */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center gap-1 opacity-0 hover:opacity-100">
                    {/* Move left (RTL = move forward) */}
                    {i > 0 && (
                      <button
                        type="button"
                        title="تقديم"
                        onClick={() => {
                          const imgs = [...form.images]
                          ;[imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]]
                          setForm(f => ({ ...f, images: imgs }))
                        }}
                        className="bg-white rounded-full p-1 text-xs font-bold shadow hover:bg-gray-100"
                      >←</button>
                    )}
                    {/* Move right */}
                    {i < form.images.length - 1 && (
                      <button
                        type="button"
                        title="تأخير"
                        onClick={() => {
                          const imgs = [...form.images]
                          ;[imgs[i + 1], imgs[i]] = [imgs[i], imgs[i + 1]]
                          setForm(f => ({ ...f, images: imgs }))
                        }}
                        className="bg-white rounded-full p-1 text-xs font-bold shadow hover:bg-gray-100"
                      >→</button>
                    )}
                    {/* Set as primary */}
                    {i > 0 && (
                      <button
                        type="button"
                        title="تعيين كرئيسية"
                        onClick={() => {
                          const imgs = [...form.images]
                          const [main] = imgs.splice(i, 1)
                          setForm(f => ({ ...f, images: [main, ...imgs] }))
                        }}
                        className="bg-[var(--primary)] text-white rounded-full p-1 text-xs font-bold shadow"
                      >★</button>
                    )}
                    {/* Delete */}
                    <button
                      type="button"
                      title="حذف"
                      onClick={() => removeImage(i)}
                      className="bg-red-500 text-white rounded-full p-1 text-xs font-bold shadow"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm opacity-50 text-center py-6 mb-4">لا توجد صور مضافة بعد</p>
          )}

          <label className="inline-flex items-center gap-2 cursor-pointer btn-outline py-2 px-4 text-sm">
            {uploading ? 'جاري الرفع...' : '+ رفع صور من الجهاز'}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              className="sr-only"
              title="رفع صور المنتج"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 sticky bottom-4 bg-white/80 p-4 rounded-xl backdrop-blur-md border border-[var(--beige)] shadow-lg">
          <button type="button" onClick={() => router.back()} className="btn-ghost flex-1">إلغاء</button>
          <button type="submit" disabled={loading} className="btn-primary flex-[2]">
            {loading ? 'جاري الحفظ...' : 'حفظ المنتج'}
          </button>
        </div>
      </form>
    </div>
  )
}
