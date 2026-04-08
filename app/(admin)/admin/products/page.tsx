'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import { toArabicPrice } from '@/lib/utils'
import Link from 'next/link'
import { MagnifyingGlassIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) toast.error('حدث خطأ أثناء الحذف')
    else {
      toast.success('تم حذف المنتج بنجاح')
      fetchProducts()
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id)
    if (error) toast.error('حدث خطأ')
    else fetchProducts()
  }

  const filtered = products.filter(p => p.name_ar.includes(search) || p.name_en.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>إدارة المنتجات</h1>
          <p className="text-sm opacity-60">عرض وإضافة وتعديل المنتجات ({products.length})</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary py-2 px-4 shadow-md">
          <PlusIcon className="w-5 h-5" /> إضافة منتج
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-4 border-b flex items-center" style={{ borderColor: 'var(--beige)' }}>
          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="ابحث عن منتج..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field py-2 pr-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
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
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                        {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : '🧴'}
                      </div>
                    </td>
                    <td>
                      <div className="font-bold">{p.name_ar}</div>
                      <div className="text-xs opacity-50 font-en">{p.name_en}</div>
                    </td>
                    <td><span className="badge badge-primary">{p.category}</span></td>
                    <td className="font-bold text-[#9C6644]">{toArabicPrice(p.price)}</td>
                    <td>
                      <span className={`font-bold ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity < 10 ? 'text-orange-500' : 'text-green-600'}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => toggleStatus(p.id, p.is_active)}
                        className={`badge ${p.is_active ? 'badge-success' : 'badge-gray'} hover:opacity-80 transition-opacity`}
                      >
                        {p.is_active ? 'نشط' : 'معطل'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/products/${p.id}`} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500">
                          <PencilSquareIcon className="w-5 h-5" />
                        </Link>
                        <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
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
      </div>
    </div>
  )
}
