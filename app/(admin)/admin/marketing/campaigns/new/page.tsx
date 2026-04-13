'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function NewCampaign() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'email' as 'email' | 'sms' | 'push' | 'social',
    target_audience: 'all' as 'all' | 'customers' | 'vip' | 'new',
    subject: '',
    body: '',
    scheduled_at: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
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
          is_active: true
        })
      })
      
      if (!res.ok) throw new Error('Failed to create')
      
      toast.success('تم إنشاء الحملة بنجاح')
      router.push('/admin/marketing/campaigns')
    } catch {
      toast.error('حدث خطأ أثناء إنشاء الحملة')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/marketing/campaigns" className="text-sm opacity-60 hover:opacity-100">الحملات</Link>
        <ArrowRightIcon className="w-4 h-4 opacity-40" />
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>حملة جديدة</h1>
      </div>

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
                onChange={e => setForm({...form, type: e.target.value as any})}
                className="input-field"
              >
                <option value="email">📧 بريد إلكتروني</option>
                <option value="sms">📱 رسائل نصية</option>
                <option value="push">🔔 إشعارات Push</option>
                <option value="social">📱 وسائل التواصل</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الجمهور المستهدف *</label>
              <select
                value={form.target_audience}
                onChange={e => setForm({...form, target_audience: e.target.value as any})}
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
              يمكنك استخدام {'{name}'} للاسم و {'{order_number}'} لرقم الطلب
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
            {saving ? 'جاري الحفظ...' : 'إنشاء الحملة'}
          </button>
          <Link href="/admin/marketing/campaigns" className="btn-outline px-6 py-3">
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  )
}
