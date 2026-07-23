'use client'

import { useState } from 'react'
import { toArabicPrice, formatDateTime, toWhatsAppPhone } from '@/lib/utils'
import { toCsv, downloadCsv } from '@/lib/csv'
import { MagnifyingGlassIcon, ArrowDownTrayIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useAdminList } from '@/hooks/useAdminList'
import toast from 'react-hot-toast'

interface Customer {
  full_name: string
  phone: string
  email: string | null
  orders_count: number
  total_spent: number
  last_order_at: string
}

export default function AdminCustomers() {
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams({ page: String(page) })
  if (submittedSearch) params.set('search', submittedSearch)

  const { items: customers, raw, loading } = useAdminList<Customer>(
    `/api/admin/customers?${params}`,
    (json) => (json as { customers?: Customer[] }).customers || []
  )
  const meta = raw as { totalPages?: number; total?: number } | null
  const totalPages = meta?.totalPages ?? 1
  const total = meta?.total ?? 0

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSubmittedSearch(search)
  }

  async function exportCSV() {
    // Export the whole filtered dataset, not just the loaded page.
    const exportParams = new URLSearchParams({ all: '1' })
    if (submittedSearch) exportParams.set('search', submittedSearch)
    const res = await fetch(`/api/admin/customers?${exportParams}`)
    if (!res.ok) { toast.error('تعذر تصدير العملاء'); return }
    const json = await res.json()
    const rows = (json.customers as Customer[]) || []
    const csv = toCsv(rows, [
      { key: 'full_name', label: 'الاسم' },
      { key: 'phone', label: 'الهاتف' },
      { key: 'email', label: 'البريد' },
      { key: 'orders_count', label: 'عدد الطلبات' },
      { key: 'total_spent', label: 'إجمالي المنفق' },
      { key: 'last_order_at', label: 'آخر طلب' },
    ])
    downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-dark)]">العملاء</h1>
          <p className="text-sm opacity-60">جميع العملاء بما فيهم الطلبات بدون تسجيل ({total})</p>
        </div>
        <button type="button" onClick={exportCSV} className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
          <ArrowDownTrayIcon className="w-4 h-4" /> تصدير CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--beige)' }}>
          <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو الهاتف..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field py-2 pr-10 text-sm w-full"
              />
            </div>
            <button type="submit" className="btn-primary py-2 px-3 text-sm">بحث</button>
          </form>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <UsersIcon className="w-12 h-12 opacity-20" />
            <p className="text-sm opacity-50">لا يوجد عملاء</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>الهاتف</th>
                    <th>البريد</th>
                    <th>عدد الطلبات</th>
                    <th>إجمالي المنفق</th>
                    <th>آخر طلب</th>
                    <th>تواصل</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={i}>
                      <td className="font-bold">{c.full_name}</td>
                      <td className="font-en text-sm" dir="ltr">{c.phone || '-'}</td>
                      <td className="font-en text-sm">{c.email || '-'}</td>
                      <td className="font-bold text-center">{c.orders_count}</td>
                      <td className="font-bold text-primary" dir="ltr">{toArabicPrice(c.total_spent)}</td>
                      <td className="text-xs" dir="ltr">{formatDateTime(c.last_order_at)}</td>
                      <td>
                        {c.phone ? (
                          <a href={`https://wa.me/${toWhatsAppPhone(c.phone)}`} target="_blank" className="badge badge-success cursor-pointer hover:bg-green-200">واتساب</a>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {customers.map((c, i) => (
                <div key={i} className="border rounded-xl p-4" style={{ borderColor: 'var(--beige)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{c.full_name}</p>
                      <p className="text-xs opacity-60 font-en" dir="ltr">{c.phone || '-'}</p>
                      <p className="text-xs opacity-60 font-en truncate">{c.email || '-'}</p>
                    </div>
                    {c.phone && (
                      <a href={`https://wa.me/${toWhatsAppPhone(c.phone)}`} target="_blank" className="badge badge-success cursor-pointer hover:bg-green-200 flex-shrink-0">واتساب</a>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm mt-3">
                    <span className="opacity-60">{c.orders_count} طلب</span>
                    <span className="font-bold text-primary" dir="ltr">{toArabicPrice(c.total_spent)}</span>
                  </div>
                  <p className="text-xs opacity-40 mt-1" dir="ltr">آخر طلب: {formatDateTime(c.last_order_at)}</p>
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
