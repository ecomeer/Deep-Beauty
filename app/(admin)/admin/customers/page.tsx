'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    // In this basic version, we deduce customers from orders
    // Real app would have a dedicated users/profiles table linked to Auth
    const { data: orders } = await supabase.from('orders').select('customer_name, customer_phone, customer_email, created_at, total')
    
    // Group by phone number
    const customerMap = new Map()
    orders?.forEach(o => {
      const existing = customerMap.get(o.customer_phone) || {
        phone: o.customer_phone,
        name: o.customer_name,
        email: o.customer_email,
        totalSpent: 0,
        ordersCount: 0,
        firstOrder: o.created_at,
        lastOrder: o.created_at,
      }
      
      existing.totalSpent += Number(o.total)
      existing.ordersCount += 1
      if (new Date(o.created_at) < new Date(existing.firstOrder)) existing.firstOrder = o.created_at
      if (new Date(o.created_at) > new Date(existing.lastOrder)) existing.lastOrder = o.created_at
      
      customerMap.set(o.customer_phone, existing)
    })
    
    setCustomers(Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent))
    setLoading(false)
  }

  const filtered = customers.filter(c => c.name.includes(search) || c.phone.includes(search))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>العملاء</h1>
        <p className="text-sm opacity-60">تصفح قائمة العملاء المسجلين ({customers.length})</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--beige)' }}>
          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو الهاتف..." 
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
                    <td className="font-bold">{c.name}</td>
                    <td className="font-en text-sm">{c.phone}</td>
                    <td className="font-en text-sm">{c.email || '-'}</td>
                    <td className="font-bold">{c.ordersCount}</td>
                    <td className="font-bold text-[#9C6644]">{c.totalSpent.toFixed(3)} د.ك</td>
                    <td className="text-xs" dir="ltr">{formatDateTime(c.lastOrder)}</td>
                    <td>
                      <a href={`https://wa.me/965${c.phone}`} target="_blank" className="badge badge-success cursor-pointer hover:bg-green-200">واتساب</a>
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
