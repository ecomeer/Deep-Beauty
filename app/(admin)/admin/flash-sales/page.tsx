'use client'

import { useState, useEffect } from 'react'
import { formatDateTime } from '@/lib/utils'
import { TrashIcon, BoltIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAdminList } from '@/hooks/useAdminList'

interface FlashSale {
  id: string
  name_ar: string
  discount_percentage: number
  starts_at: string
  ends_at: string
  is_active: boolean
  apply_to: 'all' | 'category' | 'products'
  category_name?: string | null
  product_ids?: string[]
}

interface CategoryOption {
  id: string
  name_ar: string
}

interface ProductOption {
  id: string
  name_ar: string
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('انتهى'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  return <span className="font-en font-bold text-orange-600">{timeLeft}</span>
}

export default function AdminFlashSales() {
  const { items: sales, loading, refetch: fetchSales } = useAdminList<FlashSale>(
    '/api/admin/flash-sales',
    (json) => (json as { sales?: FlashSale[] }).sales || []
  )
  const [adding, setAdding] = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [productFilter, setProductFilter] = useState('')
  const [form, setForm] = useState({
    name_ar: '',
    discount_percentage: 10,
    starts_at: '',
    ends_at: '',
    apply_to: 'all' as 'all' | 'category' | 'products',
    category_id: '',
    product_ids: [] as string[],
  })

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {})
    fetch('/api/admin/products?pageSize=200').then(r => r.json()).then(d => setProducts(d.products || [])).catch(() => {})
  }, [])

  const toggleProduct = (id: string) => {
    setForm(f => ({
      ...f,
      product_ids: f.product_ids.includes(id) ? f.product_ids.filter(p => p !== id) : [...f.product_ids, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name_ar || !form.starts_at || !form.ends_at) return toast.error('أكمل جميع الحقول المطلوبة')
    if (new Date(form.ends_at) <= new Date(form.starts_at)) return toast.error('تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء')
    if (form.apply_to === 'category' && !form.category_id) return toast.error('اختر الفئة')
    if (form.apply_to === 'products' && form.product_ids.length === 0) return toast.error('اختر منتج واحد على الأقل')

    setAdding(true)
    const res = await fetch('/api/admin/flash-sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        is_active: true,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      toast.error('حدث خطأ: ' + (d.error || ''))
    } else {
      toast.success('تم إنشاء عرض الفلاش بنجاح ⚡')
      setForm({ name_ar: '', discount_percentage: 10, starts_at: '', ends_at: '', apply_to: 'all', category_id: '', product_ids: [] })
      fetchSales()
    }
    setAdding(false)
  }

  const toggleStatus = async (id: string, current: boolean) => {
    await fetch('/api/admin/flash-sales', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    fetchSales()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return
    await fetch(`/api/admin/flash-sales?id=${id}`, { method: 'DELETE' })
    toast.success('تم الحذف')
    fetchSales()
  }

  const activeSales = sales.filter((s) => s.is_active && new Date(s.ends_at) > new Date())

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-dark)]">عروض الفلاش ⚡</h1>
        <p className="text-sm opacity-60">إدارة العروض المؤقتة مع عداد تنازلي</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--beige)' }}>
            <h2 className="text-lg font-bold mb-4">إنشاء عرض جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">اسم العرض (عربي) *</label>
                <input
                  required
                  value={form.name_ar}
                  onChange={e => setForm({ ...form, name_ar: e.target.value })}
                  className="input-field"
                  placeholder="مثال: تخفيضات نهاية الأسبوع"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">نسبة الخصم % *</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="90"
                  value={form.discount_percentage}
                  onChange={e => setForm({ ...form, discount_percentage: Number(e.target.value) })}
                  className="input-field"
                  dir="ltr"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">تطبيق على</label>
                <select
                  value={form.apply_to}
                  onChange={e => setForm({ ...form, apply_to: e.target.value as 'all' })}
                  className="input-field"
                  title="اختر نطاق تطبيق العرض"
                >
                  <option value="all">جميع المنتجات</option>
                  <option value="category">فئة محددة</option>
                  <option value="products">منتجات محددة</option>
                </select>
              </div>
              {form.apply_to === 'category' && (
                <div>
                  <label className="block mb-1 font-medium">الفئة *</label>
                  <select
                    required
                    value={form.category_id}
                    onChange={e => setForm({ ...form, category_id: e.target.value })}
                    className="input-field"
                    title="اختر الفئة المستهدفة"
                  >
                    <option value="">اختر فئة...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name_ar}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.apply_to === 'products' && (
                <div>
                  <label className="block mb-1 font-medium">
                    المنتجات * {form.product_ids.length > 0 && <span className="opacity-60">({form.product_ids.length} محدد)</span>}
                  </label>
                  <input
                    value={productFilter}
                    onChange={e => setProductFilter(e.target.value)}
                    className="input-field mb-2"
                    placeholder="بحث عن منتج..."
                  />
                  <div className="max-h-48 overflow-y-auto border rounded-xl p-2 space-y-1" style={{ borderColor: 'var(--beige)' }}>
                    {products
                      .filter(p => p.name_ar.toLowerCase().includes(productFilter.toLowerCase()))
                      .map(p => (
                        <label key={p.id} className="flex items-center gap-2 text-sm p-1 hover:bg-[var(--off-white)] rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.product_ids.includes(p.id)}
                            onChange={() => toggleProduct(p.id)}
                          />
                          {p.name_ar}
                        </label>
                      ))}
                    {products.length === 0 && <p className="text-xs opacity-50 p-2">لا توجد منتجات</p>}
                  </div>
                </div>
              )}
              <div>
                <label className="block mb-1 font-medium">تاريخ البدء *</label>
                <input
                  required
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={e => setForm({ ...form, starts_at: e.target.value })}
                  className="input-field"
                  dir="ltr"
                  title="تاريخ ووقت بدء العرض"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">تاريخ الانتهاء *</label>
                <input
                  required
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={e => setForm({ ...form, ends_at: e.target.value })}
                  className="input-field"
                  dir="ltr"
                  title="تاريخ ووقت انتهاء العرض"
                />
              </div>
              <button disabled={adding} type="submit" className="btn-primary w-full py-3 flex justify-center gap-2">
                <BoltIcon className="w-5 h-5" /> {adding ? 'جاري الإنشاء...' : 'إنشاء العرض'}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active countdowns */}
          {activeSales.length > 0 && (
            <div className="rounded-2xl p-4 border-2 border-orange-200 bg-orange-50">
              <p className="text-sm font-bold text-orange-700 mb-3">⚡ عروض نشطة الآن</p>
              <div className="space-y-2">
                {activeSales.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
                    <div>
                      <span className="font-bold text-sm">{s.name_ar}</span>
                      <span className="mr-2 badge badge-danger text-xs">-{s.discount_percentage}%</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      ينتهي بعد: <Countdown endsAt={s.ends_at} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
            <div className="overflow-x-auto">
              <table className="admin-table text-sm">
                <thead>
                  <tr>
                    <th>اسم العرض</th>
                    <th>الخصم</th>
                    <th>يطبّق على</th>
                    <th>البدء</th>
                    <th>الانتهاء</th>
                    <th>الحالة</th>
                    <th>حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="p-0">
                      <div className="flex h-40 items-center justify-center">
                        <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                      </div>
                    </td></tr>
                  ) : sales.length === 0 ? (
                    <tr><td colSpan={7} className="p-0">
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <BoltIcon className="w-12 h-12 opacity-20" />
                        <p className="text-sm opacity-50">لا توجد عروض بعد</p>
                      </div>
                    </td></tr>
                  ) : (
                    sales.map(s => (
                      <tr key={s.id}>
                        <td className="font-bold">{s.name_ar}</td>
                        <td><span className="badge badge-danger">{s.discount_percentage}%</span></td>
                        <td className="text-xs">
                          {s.apply_to === 'all' && 'كل المنتجات'}
                          {s.apply_to === 'category' && (s.category_name || 'فئة محددة')}
                          {s.apply_to === 'products' && `${s.product_ids?.length ?? 0} منتج محدد`}
                        </td>
                        <td className="text-xs font-en" dir="ltr">{formatDateTime(s.starts_at)}</td>
                        <td className="text-xs font-en" dir="ltr">{formatDateTime(s.ends_at)}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => toggleStatus(s.id, s.is_active)}
                            className={`badge ${s.is_active ? 'badge-success' : 'badge-gray'} cursor-pointer hover:opacity-80`}
                          >
                            {s.is_active ? 'نشط' : 'معطل'}
                          </button>
                        </td>
                        <td>
                          <button type="button" onClick={() => handleDelete(s.id)} title="حذف العرض" className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
