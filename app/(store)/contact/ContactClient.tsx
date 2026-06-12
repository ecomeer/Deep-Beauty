'use client'

import { useState } from 'react'
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'

const CONTACT_ITEMS = [
  {
    Icon: PhoneIcon,
    label: 'واتساب',
    value: '+965 2228 9182',
    href: 'https://wa.me/96522289182',
  },
  {
    Icon: EnvelopeIcon,
    label: 'البريد الإلكتروني',
    value: 'contact@deepbeautykw.com',
    href: 'mailto:contact@deepbeautykw.com',
  },
  {
    Icon: MapPinIcon,
    label: 'الموقع',
    value: 'الكويت',
    href: null,
  },
  {
    Icon: ClockIcon,
    label: 'ساعات العمل',
    value: 'السبت – الخميس: ٩ص – ٩م',
    href: null,
  },
]

export default function ContactClient() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return
    setStatus('sending')
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, source: 'contact_form', meta: form }),
      })
      setStatus('sent')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      className="min-h-screen pt-28 pb-20 px-6"
      style={{ background: 'var(--off-white)', color: 'var(--text-dark)' }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-xs font-semibold tracking-widest uppercase mb-4 px-4 py-1.5 rounded-full"
            style={{ background: 'var(--beige)', color: 'var(--primary)' }}
          >
            تواصلي معنا
          </span>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4 font-headline text-[var(--text-dark)]"
          >
            نحن هنا لمساعدتك
          </h1>
          <p className="text-base opacity-60 max-w-md mx-auto leading-relaxed">
            سؤال عن منتج، مشكلة في طلبك، أو تريدين اقتراحاً — تواصلي معنا وسنرد خلال ٢٤ ساعة.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            {CONTACT_ITEMS.map(({ Icon, label, value, href }) => (
              <div
                key={label}
                className="flex items-start gap-4 p-5 rounded-2xl"
                style={{ background: 'white', border: '1px solid var(--beige)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--beige)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p className="text-xs opacity-50 mb-0.5">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold transition-colors hover:opacity-70"
                      style={{ color: 'var(--primary)' }}
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold">{value}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Social */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: 'var(--beige)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-3">
                تابعينا
              </p>
              <div className="flex gap-3">
                {[
                  { label: 'Instagram', href: 'https://instagram.com/deepbeautykw' },
                  { label: 'TikTok', href: 'https://tiktok.com/@deepbeautykw' },
                  { label: 'Snapchat', href: 'https://snapchat.com/add/deepbeautykw' },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: 'white',
                      color: 'var(--primary)',
                      border: '1px solid var(--dark-beige)',
                    }}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div
            className="lg:col-span-3 rounded-3xl p-8"
            style={{ background: 'white', border: '1px solid var(--beige)' }}
          >
            <div className="flex items-center gap-3 mb-7">
              <ChatBubbleLeftEllipsisIcon
                className="w-6 h-6"
                style={{ color: 'var(--primary)' }}
              />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>
                أرسلي رسالة
              </h2>
            </div>

            {status === 'sent' ? (
              <div className="text-center py-16">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'var(--beige)' }}
                >
                  <PaperAirplaneIcon className="w-7 h-7" style={{ color: 'var(--primary)' }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-dark)' }}>
                  تم إرسال رسالتك!
                </h3>
                <p className="text-sm opacity-60">سنتواصل معك قريباً إن شاء الله.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--primary)' }}
                >
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold mb-2 opacity-60">
                      الاسم <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="اسمك الكريم"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--off-white)',
                        border: '1px solid var(--beige)',
                        color: 'var(--text-dark)',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--beige)')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2 opacity-60">
                      البريد الإلكتروني <span style={{ color: 'var(--primary)' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="example@email.com"
                      dir="ltr"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--off-white)',
                        border: '1px solid var(--beige)',
                        color: 'var(--text-dark)',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--beige)')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2 opacity-60">
                    الرسالة <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="اكتبي رسالتك هنا..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                    style={{
                      background: 'var(--off-white)',
                      border: '1px solid var(--beige)',
                      color: 'var(--text-dark)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--beige)')}
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-500">
                    حدث خطأ، يرجى المحاولة مرة أخرى أو التواصل عبر واتساب.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{ background: 'var(--primary)', color: 'white' }}
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  {status === 'sending' ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
