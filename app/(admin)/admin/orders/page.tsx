'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toArabicPrice, STATUS_COLORS, STATUS_LABELS, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { MagnifyingGlassIcon, BarsArrowDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id)
    if (error) {
      toast.error('حدث خطأ أثناء تحديث الحالة')
    } else {
      toast.success('تم تحديث الطلب بنجاح')
      fetchOrders() // refresh
    }
  }

  const filtered = orders
    .filter(o => statusFilter === 'all' ? true : o.status === statusFilter)
    .filter(o => o.order_number.toLowerCase().includes(search.toLowerCase()) || 
                 o.customer_name.includes(search) || 
                 o.customer_phone.includes(search))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>إدارة الطلبات</h1>
        <p className="text-sm opacity-60">تتبع طلبات العملاء وتحديث حالتها ({orders.length})</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ borderColor: 'var(--beige)' }}>
          {/* Filters */}
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scroll">
            <button onClick={() => setStatusFilter('all')} className={`badge ${statusFilter === 'all' ? 'badge-primary' : 'badge-gray'}`}>الكل</button>
            <button onClick={() => setStatusFilter('pending')} className={`badge ${statusFilter === 'pending' ? 'bg-orange-100 text-orange-700' : 'badge-gray'}`}>قيد الانتظار</button>
            <button onClick={() => setStatusFilter('confirmed')} className={`badge ${statusFilter === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'badge-gray'}`}>مؤكد</button>
            <button onClick={() => setStatusFilter('shipped')} className={`badge ${statusFilter === 'shipped' ? 'bg-purple-100 text-purple-700' : 'badge-gray'}`}>مشحون</button>
            <button onClick={() => setStatusFilter('delivered')} className={`badge ${statusFilter === 'delivered' ? 'bg-green-100 text-green-700' : 'badge-gray'}`}>مكتمل</button>
            <button onClick={() => setStatusFilter('cancelled')} className={`badge ${statusFilter === 'cancelled' ? 'bg-red-100 text-red-700' : 'badge-gray'}`}>ملغي</button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="ابحث برقم الطلب، الاسم، أو الهاتف..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field py-2 pr-10 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>التاريخ</th>
                <th>العميل</th>
                <th>الهاتف</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>تغيير الحالة</th>
                <th>تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 opacity-50">جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 opacity-50">لا توجد طلبات تطابق بحثك</td></tr>
              ) : (
                filtered.map(order => (
                  <tr key={order.id}>
                    <td className="font-en font-bold text-xs">{order.order_number}</td>
                    <td className="text-xs" dir="ltr">{formatDateTime(order.created_at)}</td>
                    <td className="font-medium">{order.customer_name}</td>
                    <td className="text-sm font-en">{order.customer_phone}</td>
                    <td className="font-bold text-[#9C6644]">{toArabicPrice(order.total)}</td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || 'badge-gray'}`}>
                        {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
                      </span>
                    </td>
                    <td>
                      <select 
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="text-xs border rounded-lg px-2 py-1 outline-none bg-white font-medium"
                        style={{ borderColor: 'var(--dark-beige)' }}
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="confirmed">تأكيد الطلب</option>
                        <option value="shipped">تم الشحن</option>
                        <option value="delivered">التسليم بنجاح</option>
                        <option value="cancelled">إلغاء الطلب</option>
                      </select>
                    </td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="text-[#9C6644] hover:underline text-sm font-medium">
                        عــرض
                      </Link>
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
