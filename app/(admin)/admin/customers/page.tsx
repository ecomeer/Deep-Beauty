'use client'

import { useState, useEffect } from 'react'
import { toArabicPrice, formatDateTime } from '@/lib/utils'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface Customer {
  full_name: string
  phone: string
  email: string | null
  orders_count: number
  total_spent: number
  last_order_at: string
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchCustomers() }, [])

  async function fetchCustomers() {
    const res = await fetch('/api/admin/customers')
    const data = await res.json()
    setCustomers(data.customers || [])
    setLoading(false)
  }

  const filtered = customers.filter(c =>
    c.full_name.includes(search) ||
    (c.phone || '').includes(search) ||
    (c.email || '').includes(search)
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>العملاء</h1>
        <p className="text-sm opacity-60">جميع العملاء بما فيهم الطلبات بدون تسجيل ({customers.length})</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--beige)' }}>
          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو الهاتف..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field py-2 pr-10 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
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
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 opacity-50">جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 opacity-50">لا يوجد عملاء</td></tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={i}>
                    <td className="font-bold">{c.full_name}</td>
                    <td className="font-en text-sm" dir="ltr">{c.phone || '-'}</td>
                    <td className="font-en text-sm">{c.email || '-'}</td>
                    <td className="font-bold text-center">{c.orders_count}</td>
                    <td className="font-bold" style={{ color: 'var(--primary)' }} dir="ltr">{toArabicPrice(c.total_spent)}</td>
                    <td className="text-xs" dir="ltr">{formatDateTime(c.last_order_at)}</td>
                    <td>
                      {c.phone ? (
                        <a href={`https://wa.me/965${c.phone}`} target="_blank" className="badge badge-success cursor-pointer hover:bg-green-200">واتساب</a>
                      ) : '-'}
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
