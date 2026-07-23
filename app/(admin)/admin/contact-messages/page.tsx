'use client'

import { useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { EnvelopeOpenIcon, EnvelopeIcon as EnvelopeClosedIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline'
import { useAdminList } from '@/hooks/useAdminList'
import toast from 'react-hot-toast'

interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  is_read: boolean
  created_at: string
}

export default function AdminContactMessages() {
  const [page, setPage] = useState(1)
  const { items: messages, raw, loading, refetch } = useAdminList<ContactMessage>(
    `/api/admin/contact-messages?page=${page}`,
    (json) => (json as { messages?: ContactMessage[] }).messages || []
  )
  const totalPages = (raw as { totalPages?: number } | null)?.totalPages ?? 1

  const toggleRead = async (id: string, current: boolean) => {
    const res = await fetch('/api/admin/contact-messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_read: !current }),
    })
    if (!res.ok) {
      toast.error('تعذّر تحديث حالة الرسالة')
      return
    }
    refetch()
  }

  const unreadCount = messages.filter((m) => !m.is_read).length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-dark)]">رسائل التواصل</h1>
        <p className="text-sm opacity-60">
          رسائل نموذج &quot;تواصلي معنا&quot; {unreadCount > 0 && <span className="text-primary font-bold">({unreadCount} غير مقروءة)</span>}
        </p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-2xl border" style={{ borderColor: 'var(--beige)' }}>
          <ChatBubbleLeftEllipsisIcon className="w-12 h-12 opacity-20" />
          <p className="text-sm opacity-50">لا توجد رسائل بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`bg-white rounded-2xl border p-5 ${!m.is_read ? 'border-r-4' : ''}`}
              style={{ borderColor: 'var(--beige)', borderRightColor: !m.is_read ? 'var(--primary)' : undefined }}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <span className="font-bold">{m.name}</span>
                  <a href={`mailto:${m.email}`} className="text-sm text-primary mr-2 hover:underline" dir="ltr">{m.email}</a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs opacity-50 font-en" dir="ltr">{formatDateTime(m.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => toggleRead(m.id, m.is_read)}
                    title={m.is_read ? 'وضع كغير مقروءة' : 'وضع كمقروءة'}
                    aria-label={m.is_read ? 'وضع كغير مقروءة' : 'وضع كمقروءة'}
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    {m.is_read ? <EnvelopeOpenIcon className="w-5 h-5" /> : <EnvelopeClosedIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <p className="text-sm opacity-80 whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </div>
      )}

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
