'use client'

import { useState, useEffect } from 'react'
import { toArabicPrice, STATUS_COLORS, STATUS_LABELS, formatDate, formatDateTime } from '@/lib/utils'
import { ORDER_STATUSES } from '@/lib/order-status'
import { toCsv, downloadCsv } from '@/lib/csv'
import Link from 'next/link'
import { MagnifyingGlassIcon, ArrowDownTrayIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface OrderRow {
  id: string
  order_number: string
  created_at: string
  customer_name: string
  customer_phone: string
  address_area?: string | null
  total: number
  status: string
  payment_method: string
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkApplying, setBulkApplying] = useState(false)

  async function fetchOrders() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/orders?${params}`)
    const data = await res.json()
    setOrders(data.orders || [])
    setTotalPages(data.totalPages ?? 1)
    setTotal(data.total ?? 0)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchOrders() }, [page, statusFilter])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchOrders()
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

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(o => o.id)))
  }

  async function applyBulkStatus() {
    if (!bulkStatus || selectedIds.size === 0) return
    setBulkApplying(true)
    const results = await Promise.all(
      Array.from(selectedIds).map(id =>
        fetch(`/api/admin/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: bulkStatus }),
        }).then(r => r.ok)
      )
    )
    const failed = results.filter(ok => !ok).length
    setBulkApplying(false)
    setSelectedIds(new Set())
    setBulkStatus('')
    if (failed > 0) toast.error(`فشل تحديث ${failed} طلب — قد يكون الانتقال غير مسموح لبعضها`)
    else toast.success('تم تحديث الطلبات المحددة')
    fetchOrders()
  }

  // Date filter is client-side on current page only
  const filtered = orders.filter(o => {
    if (!dateFrom && !dateTo) return true
    const d = new Date(o.created_at)
    if (dateFrom && d < new Date(dateFrom)) return false
    if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  function exportCSV() {
    const rows = filtered.map(o => ({
      order_number: o.order_number,
      date: formatDate(o.created_at),
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      address_area: o.address_area || '',
      total: Number(o.total).toFixed(3),
      status: STATUS_LABELS[o.status as keyof typeof STATUS_LABELS] || o.status,
      payment_method: o.payment_method,
    }))
    const csv = toCsv(rows, [
      { key: 'order_number', label: 'رقم الطلب' },
      { key: 'date', label: 'التاريخ' },
      { key: 'customer_name', label: 'العميل' },
      { key: 'customer_phone', label: 'الهاتف' },
      { key: 'address_area', label: 'المنطقة' },
      { key: 'total', label: 'المبلغ' },
      { key: 'status', label: 'الحالة' },
      { key: 'payment_method', label: 'طريقة الدفع' },
    ])
    downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  // Derived from the central status list so no status (e.g. processing)
  // can go missing from the filters again.
  const statusButtons = [
    { value: 'all', label: 'الكل', cls: 'badge-primary' },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s], cls: STATUS_COLORS[s] })),
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-dark)]">إدارة الطلبات</h1>
          <p className="text-sm opacity-60">تتبع طلبات العملاء وتحديث حالتها ({total})</p>
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
                onClick={() => { setStatusFilter(btn.value); setPage(1) }}
                className={`badge cursor-pointer ${statusFilter === btn.value ? btn.cls : 'badge-gray'}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Search + Date filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <form onSubmit={handleSearch} className="relative w-full sm:w-64 flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث برقم الطلب، الاسم، أو الهاتف..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field py-2 pr-10 text-sm w-full"
                />
              </div>
              <button type="submit" className="btn-primary py-2 px-3 text-sm">بحث</button>
            </form>
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

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 p-3 border-b bg-amber-50" style={{ borderColor: 'var(--beige)' }}>
            <span className="text-sm font-bold">{selectedIds.size} محدد</span>
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="text-xs border rounded-lg px-2 py-1.5 outline-none bg-white font-medium"
              style={{ borderColor: 'var(--dark-beige)' }}
            >
              <option value="">اختر حالة جديدة...</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <button
              type="button"
              onClick={applyBulkStatus}
              disabled={!bulkStatus || bulkApplying}
              className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50"
            >
              {bulkApplying ? 'جاري التطبيق...' : 'تطبيق'}
            </button>
            <button type="button" onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-500 hover:text-gray-700">
              إلغاء التحديد
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ClipboardDocumentListIcon className="w-12 h-12 opacity-20" />
            <p className="text-sm opacity-50">لا توجد طلبات تطابق بحثك</p>
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
                  {filtered.map(order => (
                    <tr key={order.id}>
                      <td>
                        <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)} title="تحديد" />
                      </td>
                      <td className="font-en font-bold text-xs">{order.order_number}</td>
                      <td className="text-xs" dir="ltr">{formatDateTime(order.created_at)}</td>
                      <td className="font-medium">{order.customer_name}</td>
                      <td className="text-sm font-en">{order.customer_phone}</td>
                      <td className="font-bold text-primary">{toArabicPrice(order.total)}</td>
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
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium hover:underline text-primary">
                          عرض
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {filtered.map(order => (
                <div key={order.id} className="border rounded-xl p-4" style={{ borderColor: 'var(--beige)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-en font-bold text-xs">#{order.order_number}</span>
                      <p className="font-medium text-sm">{order.customer_name}</p>
                      <p className="text-xs opacity-60 font-en">{order.customer_phone}</p>
                    </div>
                    <span className={`badge ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || 'badge-gray'} text-xs`}>
                      {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm text-primary">{toArabicPrice(order.total)}</span>
                    <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium hover:underline text-primary">
                      عرض التفاصيل
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60">الحالة:</span>
                    <select
                      value={order.status}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      className="flex-1 text-xs border rounded-lg px-2 py-1.5 outline-none bg-white font-medium"
                      style={{ borderColor: 'var(--dark-beige)' }}
                      title="تغيير حالة الطلب"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs opacity-50 mt-2" dir="ltr">{formatDateTime(order.created_at)}</p>
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
