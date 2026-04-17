'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  phone?: string
}

export default function AccountSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { router.push('/login'); return }
        setUser(data.user)
        setForm({ name: data.user.name || '', phone: data.user.phone || '' })
      })
      .finally(() => setLoading(false))
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('تم حفظ التغييرات')
      } else {
        toast.error('حدث خطأ أثناء الحفظ')
      }
    } catch {
      toast.error('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--off-white)', paddingTop: 'var(--nav-height)' }}>
        <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'var(--beige)', borderTopColor: 'var(--primary)' }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)', paddingTop: 'var(--nav-height)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/account" className="w-9 h-9 rounded-xl bg-white flex items-center justify-center" style={{ border: '1px solid var(--beige)' }}>
            <ArrowRightIcon className="w-4 h-4" style={{ color: 'var(--text-dark)' }} />
          </Link>
          <h1 className="font-bold text-lg" style={{ color: 'var(--text-dark)' }}>الإعدادات</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 space-y-4" style={{ border: '1px solid var(--beige)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>الاسم الكامل</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ border: '1.5px solid var(--beige)', background: 'var(--off-white)', color: 'var(--text-dark)' }}
              placeholder="اسمك الكامل"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>البريد الإلكتروني</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 rounded-xl text-sm outline-none opacity-60 cursor-not-allowed"
              style={{ border: '1.5px solid var(--beige)', background: 'var(--off-white)', color: 'var(--text-dark)' }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>لا يمكن تغيير البريد الإلكتروني</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>رقم الهاتف</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ border: '1.5px solid var(--beige)', background: 'var(--off-white)', color: 'var(--text-dark)' }}
              placeholder="مثال: 96512345678+"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--primary)' }}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      </div>
    </div>
  )
}
