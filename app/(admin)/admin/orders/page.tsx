'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toArabicPrice, STATUS_COLORS, STATUS_LABELS, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) toast.error('حدث خطأ أثناء تحديث الحالة')
    else { toast.success('تم تحديث الطلب بنجاح'); fetchOrders() }
  }

  const filtered = orders
    .filter(o => statusFilter === 'all' ? true : o.status === statusFilter)
    .filter(o => {
      if (!dateFrom && !dateTo) return true
      const d = new Date(o.created_at)
      if (dateFrom && d < new Date(dateFrom)) return false
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
    .filter(o =>
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.includes(search) ||
      o.customer_phone.includes(search)
    )

  function exportCSV() {
    const headers = ['رقم الطلب', 'التاريخ', 'العميل', 'الهاتف', 'المنطقة', 'المبلغ', 'الحالة', 'طريقة الدفع']
    const rows = filtered.map(o => [
      o.order_number,
      new Date(o.created_at).toLocaleDateString('ar-KW'),
      o.customer_name,
      o.customer_phone,
      o.address_area || '',
      Number(o.total).toFixed(3),
      STATUS_LABELS[o.status as keyof typeof STATUS_LABELS] || o.status,
      o.payment_method,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusButtons = [
    { value: 'all', label: 'الكل', cls: 'badge-primary' },
    { value: 'pending', label: 'قيد الانتظار', cls: 'bg-orange-100 text-orange-700' },
    { value: 'confirmed', label: 'مؤكد', cls: 'bg-blue-100 text-blue-700' },
    { value: 'shipped', label: 'مشحون', cls: 'bg-purple-100 text-purple-700' },
    { value: 'delivered', label: 'مكتمل', cls: 'bg-green-100 text-green-700' },
    { value: 'cancelled', label: 'ملغي', cls: 'bg-red-100 text-red-700' },
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>إدارة الطلبات</h1>
          <p className="text-sm opacity-60">تتبع طلبات العملاء وتحديث حالتها ({filtered.length})</p>
        </div>
        <button type="button" onClick={exportCSV} className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
          <ArrowDownTrayIcon className="w-4 h-4" /> تصدير CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--beige)' }}>
          {/* Status filters */}
          <div className="flex gap-2 flex-wrap">
            {statusButtons.map(btn => (
              <button
                key={btn.value}
                type="button"
                onClick={() => setStatusFilter(btn.value)}
                className={`badge cursor-pointer ${statusFilter === btn.value ? btn.cls : 'badge-gray'}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Search + Date filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative w-full sm:w-64">
              <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث برقم الطلب، الاسم، أو الهاتف..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field py-2 pr-10 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-60">من</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="input-field py-2 text-sm w-36"
                dir="ltr"
                title="من تاريخ"
              />
              <span className="text-xs opacity-60">إلى</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="input-field py-2 text-sm w-36"
                dir="ltr"
                title="إلى تاريخ"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => { setDateFrom(''); setDateTo('') }}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  مسح
                </button>
              )}
            </div>
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
                    <td className="font-bold" style={{ color: 'var(--primary)' }}>{toArabicPrice(order.total)}</td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || 'badge-gray'}`}>
                        {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        className="text-xs border rounded-lg px-2 py-1 outline-none bg-white font-medium"
                        style={{ borderColor: 'var(--dark-beige)' }}
                        title="تغيير حالة الطلب"
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="confirmed">تأكيد الطلب</option>
                        <option value="shipped">تم الشحن</option>
                        <option value="delivered">التسليم بنجاح</option>
                        <option value="cancelled">إلغاء الطلب</option>
                      </select>
                    </td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                        عرض
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
