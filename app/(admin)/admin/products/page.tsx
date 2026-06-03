'use client'

import { useState, useEffect, useCallback } from 'react'
import { Product, Category } from '@/types'
import { toArabicPrice } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { MagnifyingGlassIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products')
      if (!res.ok) throw new Error(`${res.status}`)
      const { products: data } = await res.json()
      setProducts(data || [])
    } catch {
      toast.error('فشل تحميل المنتجات')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/admin/categories'); const { categories: data } = await res.json()
    setCategories(data || [])
  }, [])

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
  }, [fetchProducts, fetchCategories])

  const handleDelete = async (id: string, name: string) => {
    // Use toast-based confirmation instead of blocking confirm()
    toast((t) => (
      <div className="text-sm text-right">
        <p className="font-bold mb-2">حذف "{name}"؟</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { toast.dismiss(t.id); doDelete(id) }}
            className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-bold"
          >نعم، احذف</button>
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 rounded-lg bg-gray-100 text-xs font-bold">إلغاء</button>
        </div>
      </div>
    ), { duration: 8000 })
  }

  const doDelete = async (id: string) => {
    // Optimistic remove
    setProducts(prev => prev.filter(p => p.id !== id))
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('حدث خطأ أثناء الحذف'); fetchProducts() }
    else toast.success('تم حذف المنتج ✓')
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic toggle
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p))
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentStatus }),
    })
    if (!res.ok) { toast.error('حدث خطأ'); fetchProducts() } // rollback
  }

  const filtered = products
    .filter(p => categoryFilter === 'all' ? true : p.category === categoryFilter)
    .filter(p => {
      if (stockFilter === 'out') return p.stock_quantity === 0
      if (stockFilter === 'low') return p.stock_quantity > 0 && p.stock_quantity < 10
      return true
    })
    .filter(p => p.name_ar.includes(search) || p.name_en.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>إدارة المنتجات</h1>
          <p className="text-sm opacity-60">عرض وإضافة وتعديل المنتجات ({filtered.length})</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary py-2 px-4 shadow-md flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> إضافة منتج
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        {/* Filters Bar */}
        <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--beige)' }}>
          {/* Search */}
          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field py-2 pr-10"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Category filter */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`badge ${categoryFilter === 'all' ? 'badge-primary' : 'badge-gray'} cursor-pointer`}
              >الكل</button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.name_ar)}
                  className={`badge ${categoryFilter === cat.name_ar ? 'badge-primary' : 'badge-gray'} cursor-pointer`}
                >{cat.name_ar}</button>
              ))}
            </div>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Stock filter */}
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setStockFilter('all')} className={`badge ${stockFilter === 'all' ? 'badge-primary' : 'badge-gray'} cursor-pointer`}>كل المخزون</button>
              <button type="button" onClick={() => setStockFilter('low')} className={`badge ${stockFilter === 'low' ? 'bg-orange-100 text-orange-700' : 'badge-gray'} cursor-pointer`}>مخزون منخفض</button>
              <button type="button" onClick={() => setStockFilter('out')} className={`badge ${stockFilter === 'out' ? 'badge-danger' : 'badge-gray'} cursor-pointer`}>نفذ المخزون</button>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>الصورة</th>
                <th>الاسم</th>
                <th>الفئة</th>
                <th>السعر</th>
                <th>المخزون</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 opacity-50">جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 opacity-50">لا توجد منتجات تطابق بحثك</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center relative">
                        {p.images?.[0]
                          ? <Image src={p.images[0]} alt={p.name_ar} fill sizes="48px" className="object-cover" />
                          : <span className="text-lg">🧴</span>}
                      </div>
                    </td>
                    <td>
                      <div className="font-bold">{p.name_ar}</div>
                      <div className="text-xs opacity-50 font-en">{p.name_en}</div>
                    </td>
                    <td><span className="badge badge-primary">{p.category}</span></td>
                    <td className="font-bold" style={{ color: 'var(--primary)' }}>{toArabicPrice(p.price)}</td>
                    <td>
                      <span className={`font-bold ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity < 10 ? 'text-orange-500' : 'text-green-600'}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggleStatus(p.id, p.is_active)}
                        className={`badge ${p.is_active ? 'badge-success' : 'badge-gray'} hover:opacity-80 transition-opacity cursor-pointer`}
                      >
                        {p.is_active ? 'نشط' : 'معطل'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/products/${p.id}`} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500">
                          <PencilSquareIcon className="w-5 h-5" />
                        </Link>
                        <button type="button" onClick={() => handleDelete(p.id, p.name_ar)} title="حذف المنتج" className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border rounded-xl p-4" style={{ borderColor: 'var(--beige)' }}>
                <div className="flex gap-3 mb-3">
                  <div className="skeleton w-16 h-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 rounded w-3/4" />
                    <div className="skeleton h-3 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 opacity-50">لا توجد منتجات تطابق بحثك</div>
          ) : (
            filtered.map(p => (
              <div key={p.id} className="border rounded-xl p-4" style={{ borderColor: 'var(--beige)' }}>
                <div className="flex gap-3 mb-3">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xl">🧴</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{p.name_ar}</div>
                    <div className="text-xs opacity-50 font-en truncate">{p.name_en}</div>
                    <span className="badge badge-primary text-xs mt-1">{p.category}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold" style={{ color: 'var(--primary)' }}>{toArabicPrice(p.price)}</span>
                  <span className={`font-bold text-sm ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity < 10 ? 'text-orange-500' : 'text-green-600'}`}>
                    مخزون: {p.stock_quantity}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleStatus(p.id, p.is_active)}
                    className={`flex-1 badge ${p.is_active ? 'badge-success' : 'badge-gray'} py-2 text-sm cursor-pointer`}
                  >
                    {p.is_active ? 'نشط' : 'معطل'}
                  </button>
                  <Link href={`/admin/products/${p.id}`} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500">
                    <PencilSquareIcon className="w-5 h-5" />
                  </Link>
                  <button type="button" onClick={() => handleDelete(p.id, p.name_ar)} title="حذف المنتج" className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
