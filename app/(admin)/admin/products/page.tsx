'use client'

import { useState } from 'react'
import { Product, Category } from '@/types'
import { useAdminList } from '@/hooks/useAdminList'
import { toArabicPrice } from '@/lib/utils'
import { toCsv, downloadCsv } from '@/lib/csv'
import Link from 'next/link'
import { MagnifyingGlassIcon, PlusIcon, PencilSquareIcon, TrashIcon, ArrowDownTrayIcon, CubeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkApplying, setBulkApplying] = useState(false)

  const { items: categories } = useAdminList<Category>(
    '/api/admin/categories',
    (json) => (json as { categories?: Category[] }).categories || []
  )

  const params = new URLSearchParams({ page: String(page) })
  if (submittedSearch) params.set('search', submittedSearch)
  if (categoryFilter !== 'all') params.set('category', categoryFilter)
  if (stockFilter !== 'all') params.set('stock', stockFilter)

  const { items: products, raw, loading, refetch: fetchProducts } = useAdminList<Product>(
    `/api/admin/products?${params}`,
    (json) => (json as { products?: Product[] }).products || []
  )
  const meta = raw as { totalPages?: number; total?: number } | null
  const totalPages = meta?.totalPages ?? 1
  const total = meta?.total ?? 0

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSubmittedSearch(search)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (!res.ok) toast.error('حدث خطأ أثناء الحذف')
    else { toast.success('تم حذف المنتج بنجاح'); fetchProducts() }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentStatus }),
    })
    if (!res.ok) toast.error('حدث خطأ')
    else fetchProducts()
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)))
  }

  async function bulkAction(action: 'activate' | 'deactivate' | 'delete') {
    if (selectedIds.size === 0) return
    if (action === 'delete' && !confirm(`هل أنت متأكد من حذف ${selectedIds.size} منتج؟`)) return
    setBulkApplying(true)
    const res = await fetch('/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds), action }),
    })
    setBulkApplying(false)
    setSelectedIds(new Set())
    if (!res.ok) { toast.error('حدث خطأ أثناء العملية'); return }
    toast.success(action === 'delete' ? 'تم الحذف' : 'تم التحديث')
    fetchProducts()
  }

  // Stock filtering now happens server-side (see the `stock` param above), so
  // `filtered` is just the current page as returned by the API.
  const filtered = products

  async function exportCSV() {
    // Export the whole filtered dataset, not just the loaded page.
    const exportParams = new URLSearchParams({ all: '1' })
    if (submittedSearch) exportParams.set('search', submittedSearch)
    if (categoryFilter !== 'all') exportParams.set('category', categoryFilter)
    if (stockFilter !== 'all') exportParams.set('stock', stockFilter)
    const res = await fetch(`/api/admin/products?${exportParams}`)
    if (!res.ok) { toast.error('تعذر تصدير المنتجات'); return }
    const json = await res.json()
    const rows = (json.products as Product[]) || []
    const csv = toCsv(rows, [
      { key: 'name_ar', label: 'الاسم' },
      { key: 'category', label: 'الفئة' },
      { key: 'price', label: 'السعر' },
      { key: 'stock_quantity', label: 'المخزون' },
      { key: 'is_active', label: 'نشط' },
    ])
    downloadCsv(`products-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-dark)]">إدارة المنتجات</h1>
          <p className="text-sm opacity-60">عرض وإضافة وتعديل المنتجات ({loading ? '…' : total})</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={exportCSV} className="btn-outline py-2 px-4 flex items-center gap-2">
            <ArrowDownTrayIcon className="w-4 h-4" /> تصدير CSV
          </button>
          <Link href="/admin/products/new" className="btn-primary py-2 px-4 shadow-md flex items-center gap-2">
            <PlusIcon className="w-5 h-5" /> إضافة منتج
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        {/* Filters Bar */}
        <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--beige)' }}>
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field py-2 pr-10 w-full"
              />
            </div>
            <button type="submit" className="btn-primary py-2 px-3 text-sm">بحث</button>
          </form>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Category filter */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => { setCategoryFilter('all'); setPage(1) }}
                className={`badge ${categoryFilter === 'all' ? 'badge-primary' : 'badge-gray'} cursor-pointer`}
              >الكل</button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setCategoryFilter(cat.name_ar); setPage(1) }}
                  className={`badge ${categoryFilter === cat.name_ar ? 'badge-primary' : 'badge-gray'} cursor-pointer`}
                >{cat.name_ar}</button>
              ))}
            </div>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Stock filter */}
            <div className="flex gap-1.5">
              <button type="button" onClick={() => { setStockFilter('all'); setPage(1) }} className={`badge ${stockFilter === 'all' ? 'badge-primary' : 'badge-gray'} cursor-pointer`}>كل المخزون</button>
              <button type="button" onClick={() => { setStockFilter('low'); setPage(1) }} className={`badge ${stockFilter === 'low' ? 'bg-orange-100 text-orange-700' : 'badge-gray'} cursor-pointer`}>مخزون منخفض</button>
              <button type="button" onClick={() => { setStockFilter('out'); setPage(1) }} className={`badge ${stockFilter === 'out' ? 'badge-danger' : 'badge-gray'} cursor-pointer`}>نفذ المخزون</button>
            </div>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 p-3 border-b bg-amber-50" style={{ borderColor: 'var(--beige)' }}>
            <span className="text-sm font-bold">{selectedIds.size} محدد</span>
            <button type="button" onClick={() => bulkAction('activate')} disabled={bulkApplying} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-50">تفعيل</button>
            <button type="button" onClick={() => bulkAction('deactivate')} disabled={bulkApplying} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-50">تعطيل</button>
            <button type="button" onClick={() => bulkAction('delete')} disabled={bulkApplying} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">حذف</button>
            <button type="button" onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-500 hover:text-gray-700">إلغاء التحديد</button>
          </div>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CubeIcon className="w-12 h-12 opacity-20" />
            <p className="text-sm opacity-50">لا توجد منتجات تطابق بحثك</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="w-8">
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        onChange={toggleSelectAll}
                        title="تحديد الكل"
                      />
                    </th>
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
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} title="تحديد" />
                      </td>
                      <td>
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                          {p.images?.[0]
                            ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                            : <span className="text-lg">🧴</span>}
                        </div>
                      </td>
                      <td>
                        <div className="font-bold">{p.name_ar}</div>
                        <div className="text-xs opacity-50 font-en">{p.name_en}</div>
                      </td>
                      <td><span className="badge badge-primary">{p.category}</span></td>
                      <td className="font-bold text-primary">{toArabicPrice(p.price)}</td>
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
                          <Link href={`/admin/products/${p.id}`} title="تعديل المنتج" aria-label="تعديل المنتج" className="p-2 rounded-lg hover:bg-blue-50 text-blue-500">
                            <PencilSquareIcon className="w-5 h-5" />
                          </Link>
                          <button type="button" onClick={() => handleDelete(p.id)} title="حذف المنتج" aria-label="حذف المنتج" className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {filtered.map(p => (
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
                    <span className="font-bold text-primary">{toArabicPrice(p.price)}</span>
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
                    <Link href={`/admin/products/${p.id}`} title="تعديل المنتج" aria-label="تعديل المنتج" className="p-2 rounded-lg hover:bg-blue-50 text-blue-500">
                      <PencilSquareIcon className="w-5 h-5" />
                    </Link>
                    <button type="button" onClick={() => handleDelete(p.id)} title="حذف المنتج" aria-label="حذف المنتج" className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--beige)' }}
          >السابق</button>
          <span className="text-sm opacity-60">صفحة {page} من {totalPages}</span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--beige)' }}
          >التالي</button>
        </div>
      )}
    </div>
  )
}
