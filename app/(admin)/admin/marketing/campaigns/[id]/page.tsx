'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

type CampaignType = 'email' | 'sms' | 'push' | 'social'
type CampaignAudience = 'all' | 'customers' | 'vip' | 'new'

export default function EditCampaign() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [alreadySent, setAlreadySent] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'email' as CampaignType,
    target_audience: 'all' as CampaignAudience,
    subject: '',
    body: '',
    scheduled_at: ''
  })

  const loadCampaign = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/marketing/${id}`)
      if (!res.ok) { setNotFound(true); return }
      const c = await res.json()
      const content = (c.content ?? {}) as { subject?: string; body?: string }
      setAlreadySent(!!c.sent_at)
      setForm({
        title: c.title ?? '',
        description: c.description ?? '',
        type: (c.type ?? 'email') as CampaignType,
        target_audience: (c.target_audience ?? 'all') as CampaignAudience,
        subject: content.subject ?? '',
        body: content.body ?? '',
        // datetime-local wants `YYYY-MM-DDTHH:mm`
        scheduled_at: c.scheduled_at ? String(c.scheduled_at).slice(0, 16) : ''
      })
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadCampaign() }, [loadCampaign])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/marketing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
          target_audience: form.target_audience,
          content: {
            subject: form.subject,
            body: form.body
          },
          scheduled_at: form.scheduled_at || null,
        })
      })

      if (!res.ok) throw new Error('Failed to update')

      toast.success('تم تحديث الحملة بنجاح')
      router.push('/admin/marketing/campaigns')
    } catch {
      toast.error('حدث خطأ أثناء تحديث الحملة')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="animate-spin w-8 h-8 rounded-full border-4" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-sm opacity-60 mb-4">الحملة غير موجودة</p>
        <Link href="/admin/marketing/campaigns" className="btn-outline px-4 py-2">العودة للحملات</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/marketing/campaigns" className="text-sm opacity-60 hover:opacity-100">الحملات</Link>
        <ArrowRightIcon className="w-4 h-4 opacity-40" />
        <h1 className="text-xl font-bold text-[var(--text-dark)]">تعديل الحملة</h1>
      </div>

      {alreadySent && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          تم إرسال هذه الحملة بالفعل — التعديلات لن تُعيد إرسالها.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--beige)' }}>
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5">عنوان الحملة *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="input-field"
              placeholder="مثال: عروض شهر رمضان"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">الوصف</label>
            <textarea
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="input-field"
              rows={2}
              placeholder="وصف مختصر للحملة..."
            />
          </div>

          {/* Type & Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">نوع الحملة *</label>
              <select
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value as CampaignType})}
                className="input-field"
              >
                <option value="email">📧 بريد إلكتروني</option>
                <option value="sms" disabled>📱 رسائل نصية (قريباً)</option>
                <option value="push" disabled>🔔 إشعارات Push (قريباً)</option>
                <option value="social" disabled>📱 وسائل التواصل (قريباً)</option>
              </select>
              <p className="text-xs opacity-50 mt-1">الإرسال الفعلي متاح حالياً للبريد الإلكتروني فقط</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الجمهور المستهدف *</label>
              <select
                value={form.target_audience}
                onChange={e => setForm({...form, target_audience: e.target.value as CampaignAudience})}
                className="input-field"
              >
                <option value="all">الجميع</option>
                <option value="customers">العملاء</option>
                <option value="vip">VIP</option>
                <option value="new">عملاء جدد</option>
              </select>
            </div>
          </div>

          {/* Subject (for email) */}
          {form.type === 'email' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">موضوع الرسالة *</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm({...form, subject: e.target.value})}
                className="input-field"
                placeholder="موضوع البريد الإلكتروني..."
                required
              />
            </div>
          )}

          {/* Body */}
          <div>
            <label className="block text-sm font-medium mb-1.5">محتوى الرسالة *</label>
            <textarea
              value={form.body}
              onChange={e => setForm({...form, body: e.target.value})}
              className="input-field"
              rows={6}
              placeholder="اكتب محتوى رسالتك هنا..."
              required
            />
            <p className="text-xs opacity-50 mt-1">
              يمكنك استخدام {'{name}'} وسيتم استبدالها باسم كل مستلم
            </p>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium mb-1.5">جدولة الإرسال (اختياري)</label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={e => setForm({...form, scheduled_at: e.target.value})}
              className="input-field"
              dir="ltr"
            />
            <p className="text-xs opacity-50 mt-1">اتركه فارغاً للإرسال الفوري</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 py-3"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
          <Link href="/admin/marketing/campaigns" className="btn-outline px-6 py-3">
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  )
}
