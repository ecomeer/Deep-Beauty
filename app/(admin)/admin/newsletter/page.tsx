'use client'

import { useState, useEffect } from 'react'
import { formatDateTime } from '@/lib/utils'
import { MagnifyingGlassIcon, ArrowDownTrayIcon, TrashIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Subscriber {
  id: string
  email: string
  created_at: string
}

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchSubscribers() }, [])

  async function fetchSubscribers() {
    const res = await fetch('/api/admin/newsletter')
    if (!res.ok) { toast.error('تعذّر تحميل المشتركين'); setLoading(false); return }
    const data = await res.json()
    setSubscribers(data.subscribers || [])
    setLoading(false)
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`هل أنت متأكد من حذف ${email}؟`)) return
    const res = await fetch(`/api/admin/newsletter/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('حدث خطأ أثناء الحذف'); return }
    toast.success('تم الحذف')
    setSubscribers(prev => prev.filter(s => s.id !== id))
  }

  function exportCSV() {
    const headers = ['البريد الإلكتروني', 'تاريخ الاشتراك']
    const rows = filtered.map(s => [s.email, formatDateTime(s.created_at)])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>المشتركون في النشرة</h1>
          <p className="text-sm opacity-60">إجمالي المشتركين: {subscribers.length}</p>
        </div>
        <button onClick={exportCSV} className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
          <ArrowDownTrayIcon className="w-4 h-4" /> تصدير CSV
        </button>
      </div>

      {/* Stat */}
      <div className="stats-card flex items-center gap-4 mb-8 max-w-xs">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50">
          <EnvelopeIcon className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <p className="text-sm opacity-60 mb-1">إجمالي المشتركين</p>
          <h3 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>{subscribers.length}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--beige)' }}>
          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث بالبريد الإلكتروني..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field py-2 pr-10 text-sm"
              dir="ltr"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>البريد الإلكتروني</th>
                <th>تاريخ الاشتراك</th>
                <th>حذف</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-10 opacity-50">جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-10 opacity-50">لا يوجد مشتركون</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id}>
                    <td className="font-en text-sm" dir="ltr">{s.email}</td>
                    <td className="text-xs" dir="ltr">{formatDateTime(s.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id, s.email)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                      >
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
  )
}
