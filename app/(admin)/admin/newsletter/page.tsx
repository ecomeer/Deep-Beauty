'use client'

import { useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { toCsv, downloadCsv } from '@/lib/csv'
import { MagnifyingGlassIcon, ArrowDownTrayIcon, TrashIcon, EnvelopeIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAdminList } from '@/hooks/useAdminList'

interface Subscriber {
  id: string
  email: string
  created_at: string
}

export default function AdminNewsletter() {
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [page, setPage] = useState(1)

  const listParams = new URLSearchParams({ page: String(page) })
  if (submittedSearch) listParams.set('search', submittedSearch)

  const { items: subscribers, raw, setItems: setSubscribers, loading } = useAdminList<Subscriber>(
    `/api/admin/newsletter?${listParams}`,
    (json) => (json as { subscribers?: Subscriber[] }).subscribers || []
  )
  const meta = raw as { total?: number; totalPages?: number } | null
  const total = meta?.total ?? subscribers.length
  const totalPages = meta?.totalPages ?? 1

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSubmittedSearch(search)
  }
  const [composeOpen, setComposeOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [compose, setCompose] = useState({ subject: '', body: '' })

  const sendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!compose.subject.trim() || !compose.body.trim()) {
      toast.error('العنوان والمحتوى مطلوبان')
      return
    }
    if (!confirm('سيتم إرسال النشرة إلى جميع المشتركين النشطين. متابعة؟')) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compose),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'تعذر الإرسال'); return }
      toast.success(data.message || 'تم الإرسال')
      setComposeOpen(false)
      setCompose({ subject: '', body: '' })
    } catch {
      toast.error('تعذر الإرسال')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`هل أنت متأكد من حذف ${email}؟`)) return
    const res = await fetch(`/api/admin/newsletter/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('حدث خطأ أثناء الحذف'); return }
    toast.success('تم الحذف')
    setSubscribers(prev => prev.filter(s => s.id !== id))
  }

  async function exportCSV() {
    // Export the whole filtered dataset (escaped via the shared CSV helper),
    // not just the loaded page.
    const exportParams = new URLSearchParams({ all: '1' })
    if (submittedSearch) exportParams.set('search', submittedSearch)
    const res = await fetch(`/api/admin/newsletter?${exportParams}`)
    if (!res.ok) { toast.error('تعذر تصدير المشتركين'); return }
    const json = await res.json()
    const rows = ((json.subscribers as Subscriber[]) || []).map(s => ({
      email: s.email,
      subscribed_at: formatDateTime(s.created_at),
    }))
    const csv = toCsv(rows, [
      { key: 'email', label: 'البريد الإلكتروني' },
      { key: 'subscribed_at', label: 'تاريخ الاشتراك' },
    ])
    downloadCsv(`newsletter-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-dark)]">المشتركون في النشرة</h1>
          <p className="text-sm opacity-60">إجمالي المشتركين: {total}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
            <ArrowDownTrayIcon className="w-4 h-4" /> تصدير CSV
          </button>
          <button onClick={() => setComposeOpen(true)} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <PaperAirplaneIcon className="w-4 h-4" /> إرسال نشرة
          </button>
        </div>
      </div>

      {/* Compose newsletter modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !sending && setComposeOpen(false)} />
          <form onSubmit={sendNewsletter} className="relative bg-white rounded-2xl shadow-xl border w-full max-w-lg p-6" style={{ borderColor: 'var(--beige)' }}>
            <h2 className="text-lg font-bold mb-4">إرسال نشرة بريدية</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">موضوع الرسالة *</label>
                <input
                  type="text"
                  value={compose.subject}
                  onChange={e => setCompose({ ...compose, subject: e.target.value })}
                  className="input-field"
                  placeholder="عنوان النشرة..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">المحتوى *</label>
                <textarea
                  value={compose.body}
                  onChange={e => setCompose({ ...compose, body: e.target.value })}
                  className="input-field"
                  rows={6}
                  placeholder="اكتب محتوى النشرة هنا..."
                  required
                />
                <p className="text-xs opacity-50 mt-1">يمكنك استخدام {'{name}'} وسيتم استبدالها باسم كل مشترك</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button type="submit" disabled={sending} className="btn-primary flex-1 py-2.5 disabled:opacity-50">
                {sending ? 'جاري الإرسال...' : 'إرسال للمشتركين'}
              </button>
              <button type="button" onClick={() => setComposeOpen(false)} disabled={sending} className="btn-outline px-6 py-2.5">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stat */}
      <div className="stats-card flex items-center gap-4 mb-8 max-w-xs">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50">
          <EnvelopeIcon className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <p className="text-sm opacity-60 mb-1">إجمالي المشتركين</p>
          <h3 className="text-2xl font-bold text-[var(--text-dark)]">{total}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--beige)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--beige)' }}>
          <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث بالبريد الإلكتروني..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field py-2 pr-10 text-sm w-full"
                dir="ltr"
              />
            </div>
            <button type="submit" className="btn-primary py-2 px-3 text-sm">بحث</button>
          </form>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : subscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <EnvelopeIcon className="w-12 h-12 opacity-20" />
            <p className="text-sm opacity-50">لا يوجد مشتركون</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>البريد الإلكتروني</th>
                    <th>تاريخ الاشتراك</th>
                    <th>حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map(s => (
                    <tr key={s.id}>
                      <td className="font-en text-sm" dir="ltr">{s.email}</td>
                      <td className="text-xs" dir="ltr">{formatDateTime(s.created_at)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id, s.email)}
                          title="حذف المشترك"
                          aria-label="حذف المشترك"
                          className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {subscribers.map(s => (
                <div key={s.id} className="border rounded-xl p-4 flex items-center justify-between gap-3" style={{ borderColor: 'var(--beige)' }}>
                  <div className="min-w-0">
                    <p className="font-en text-sm font-medium truncate" dir="ltr">{s.email}</p>
                    <p className="text-xs opacity-50 mt-0.5" dir="ltr">{formatDateTime(s.created_at)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id, s.email)}
                    title="حذف المشترك"
                    aria-label="حذف المشترك"
                    className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
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
